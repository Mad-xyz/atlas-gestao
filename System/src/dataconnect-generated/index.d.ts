import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, ExecuteQueryOptions } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface EventParticipant_Key {
  eventId: UUIDString;
  studentId: string;
  __typename?: 'EventParticipant_Key';
}

export interface Event_Key {
  id: UUIDString;
  __typename?: 'Event_Key';
}

export interface GetAttendanceCountInRangeData {
  eventParticipants: ({
    registeredAt: TimestampString;
  })[];
}

export interface GetAttendanceCountInRangeVariables {
  studentId: string;
  startDate: TimestampString;
}

export interface GetDashboardStatsData {
  todayPresences: ({
    studentId: string;
    registeredAt: TimestampString;
  })[];
  recentPresences: ({
    studentId: string;
    registeredAt: TimestampString;
  })[];
}

export interface GetDashboardStatsVariables {
  todayStart: TimestampString;
  fourteenDaysAgo: TimestampString;
}

export interface GetLatestAttendanceData {
  eventParticipants: ({
    registeredAt: TimestampString;
  })[];
}

export interface GetLatestAttendanceVariables {
  studentId: string;
}

export interface GetStudentAttendanceStatsData {
  eventParticipants: ({
    registeredAt: TimestampString;
  })[];
}

export interface GetStudentAttendanceStatsVariables {
  studentId: string;
  startOfMonth: TimestampString;
}

export interface GetWeeklyFrequencyData {
  eventParticipants: ({
    registeredAt: TimestampString;
  })[];
}

export interface GetWeeklyFrequencyVariables {
  thirtyDaysAgo: TimestampString;
}

export interface Transaction_Key {
  id: UUIDString;
  __typename?: 'Transaction_Key';
}

interface GetLatestAttendanceRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetLatestAttendanceVariables): QueryRef<GetLatestAttendanceData, GetLatestAttendanceVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetLatestAttendanceVariables): QueryRef<GetLatestAttendanceData, GetLatestAttendanceVariables>;
  operationName: string;
}
export const getLatestAttendanceRef: GetLatestAttendanceRef;

export function getLatestAttendance(vars: GetLatestAttendanceVariables, options?: ExecuteQueryOptions): QueryPromise<GetLatestAttendanceData, GetLatestAttendanceVariables>;
export function getLatestAttendance(dc: DataConnect, vars: GetLatestAttendanceVariables, options?: ExecuteQueryOptions): QueryPromise<GetLatestAttendanceData, GetLatestAttendanceVariables>;

interface GetAttendanceCountInRangeRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetAttendanceCountInRangeVariables): QueryRef<GetAttendanceCountInRangeData, GetAttendanceCountInRangeVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetAttendanceCountInRangeVariables): QueryRef<GetAttendanceCountInRangeData, GetAttendanceCountInRangeVariables>;
  operationName: string;
}
export const getAttendanceCountInRangeRef: GetAttendanceCountInRangeRef;

export function getAttendanceCountInRange(vars: GetAttendanceCountInRangeVariables, options?: ExecuteQueryOptions): QueryPromise<GetAttendanceCountInRangeData, GetAttendanceCountInRangeVariables>;
export function getAttendanceCountInRange(dc: DataConnect, vars: GetAttendanceCountInRangeVariables, options?: ExecuteQueryOptions): QueryPromise<GetAttendanceCountInRangeData, GetAttendanceCountInRangeVariables>;

interface GetDashboardStatsRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetDashboardStatsVariables): QueryRef<GetDashboardStatsData, GetDashboardStatsVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetDashboardStatsVariables): QueryRef<GetDashboardStatsData, GetDashboardStatsVariables>;
  operationName: string;
}
export const getDashboardStatsRef: GetDashboardStatsRef;

export function getDashboardStats(vars: GetDashboardStatsVariables, options?: ExecuteQueryOptions): QueryPromise<GetDashboardStatsData, GetDashboardStatsVariables>;
export function getDashboardStats(dc: DataConnect, vars: GetDashboardStatsVariables, options?: ExecuteQueryOptions): QueryPromise<GetDashboardStatsData, GetDashboardStatsVariables>;

interface GetStudentAttendanceStatsRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetStudentAttendanceStatsVariables): QueryRef<GetStudentAttendanceStatsData, GetStudentAttendanceStatsVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetStudentAttendanceStatsVariables): QueryRef<GetStudentAttendanceStatsData, GetStudentAttendanceStatsVariables>;
  operationName: string;
}
export const getStudentAttendanceStatsRef: GetStudentAttendanceStatsRef;

export function getStudentAttendanceStats(vars: GetStudentAttendanceStatsVariables, options?: ExecuteQueryOptions): QueryPromise<GetStudentAttendanceStatsData, GetStudentAttendanceStatsVariables>;
export function getStudentAttendanceStats(dc: DataConnect, vars: GetStudentAttendanceStatsVariables, options?: ExecuteQueryOptions): QueryPromise<GetStudentAttendanceStatsData, GetStudentAttendanceStatsVariables>;

interface GetWeeklyFrequencyRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetWeeklyFrequencyVariables): QueryRef<GetWeeklyFrequencyData, GetWeeklyFrequencyVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetWeeklyFrequencyVariables): QueryRef<GetWeeklyFrequencyData, GetWeeklyFrequencyVariables>;
  operationName: string;
}
export const getWeeklyFrequencyRef: GetWeeklyFrequencyRef;

export function getWeeklyFrequency(vars: GetWeeklyFrequencyVariables, options?: ExecuteQueryOptions): QueryPromise<GetWeeklyFrequencyData, GetWeeklyFrequencyVariables>;
export function getWeeklyFrequency(dc: DataConnect, vars: GetWeeklyFrequencyVariables, options?: ExecuteQueryOptions): QueryPromise<GetWeeklyFrequencyData, GetWeeklyFrequencyVariables>;

