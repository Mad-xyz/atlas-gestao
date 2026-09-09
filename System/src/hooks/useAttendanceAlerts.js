import { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { 
  collectionGroup, 
  query, 
  where, 
  getDocs,
  Timestamp 
} from 'firebase/firestore';
import { SUB_COLLECTIONS } from '../firebase/collections';
import { useOrganizacao } from '../context/OrganizacaoContext';

/**
 * Hook de Assiduidade - Versão "No-Index" (Ultra Compatível)
 * 
 * MULTI-TENANT: consulta a subcoleção `presencas` (via collectionGroup) filtrando
 * pela organização ativa. Para evitar a necessidade de criar índices compostos
 * manualmente no Firebase Console, a filtragem básica é feita no servidor e a
 * lógica de ordenação/contagem no cliente.
 */
export function useAttendanceAlerts(studentId, createdAt = null) {
  const { organizacaoAtualId } = useOrganizacao();
  const [status, setStatus] = useState('loading');
  const [lastAttendance, setLastAttendance] = useState(null);
  const [monthlyCount, setMonthlyCount] = useState(0);
  const [consecutiveMisses, setConsecutiveMisses] = useState(0); 
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!studentId || !organizacaoAtualId) {
      setIsLoading(false);
      return;
    }

    async function fetchData() {
      setIsLoading(true);
      try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        // MULTI-TENANT: collectionGroup 'presencas' filtrado pela organização ativa
        const q = query(
          collectionGroup(db, SUB_COLLECTIONS.PRESENCAS),
          where('organizationId', '==', organizacaoAtualId),
          where('studentId', '==', studentId)
        );
        
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
          handleNoAttendance(now, createdAt);
          return;
        }

        // PROCESSAMENTO NO CLIENTE (Mais estável para o desenvolvedor)
        const allAttendances = snapshot.docs.map(doc => {
          const data = doc.data()
          const d = data.date || data.data
          const dateObj = d instanceof Timestamp ? d.toDate() : (d?.toDate ? d.toDate() : new Date(d))
          return { date: dateObj, status: data.status || 'present' }
        }).filter(r => !isNaN(r.date?.getTime()))

        // Apenas presenças reais para contagem e último treino
        const presentOnly = allAttendances.filter(r => r.status === 'present').map(r => r.date)

        // 1. Encontrar a ÚLTIMA aula
        const sorted = presentOnly.sort((a, b) => b - a)
        const latest = sorted[0]
        setLastAttendance(latest)

        // 2. Contar aulas no MÊS ATUAL
        const thisMonthCount = presentOnly.filter(d => d >= startOfMonth).length
        setMonthlyCount(thisMonthCount);

        // 3. Definir Status
        const diffDays = (now - latest) / (1000 * 60 * 60 * 24);
        if (diffDays > 30) {
          setStatus('critical');
        } else if (diffDays > 14) {
          setStatus('warning');
        } else {
          setStatus('active');
        }

      } catch (err) {
        console.error('❌ [useAttendanceAlerts] Erro ao processar assiduidade:', err);
        setStatus('error');
      } finally {
        setIsLoading(false);
      }
    }

    function handleNoAttendance(now, created) {
      let isNew = false;
      if (created) {
        const joined = created instanceof Timestamp ? created.toDate() : 
                      (created?.toDate ? created.toDate() : new Date(created));
        
        if (!isNaN(joined.getTime())) {
          const daysSinceJoin = (now - joined) / (1000 * 60 * 60 * 24);
          if (daysSinceJoin < 30) isNew = true;
        }
      }
      setLastAttendance(null);
      setMonthlyCount(0);
      setStatus(isNew ? 'active' : 'critical');
    }

    fetchData();
  }, [studentId, createdAt, organizacaoAtualId]);

  return { status, lastAttendance, monthlyCount, consecutiveMisses, isLoading };
}
