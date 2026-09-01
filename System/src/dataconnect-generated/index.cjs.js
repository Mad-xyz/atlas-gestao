const { queryRef, executeQuery, validateArgsWithOptions, validateArgs } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'attendance',
  service: 'academy2',
  location: 'southamerica-east1'
};
exports.connectorConfig = connectorConfig;

const getLatestAttendanceRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetLatestAttendance', inputVars);
}
getLatestAttendanceRef.operationName = 'GetLatestAttendance';
exports.getLatestAttendanceRef = getLatestAttendanceRef;

exports.getLatestAttendance = function getLatestAttendance(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(getLatestAttendanceRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const getAttendanceCountInRangeRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetAttendanceCountInRange', inputVars);
}
getAttendanceCountInRangeRef.operationName = 'GetAttendanceCountInRange';
exports.getAttendanceCountInRangeRef = getAttendanceCountInRangeRef;

exports.getAttendanceCountInRange = function getAttendanceCountInRange(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(getAttendanceCountInRangeRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const getDashboardStatsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'getDashboardStats', inputVars);
}
getDashboardStatsRef.operationName = 'getDashboardStats';
exports.getDashboardStatsRef = getDashboardStatsRef;

exports.getDashboardStats = function getDashboardStats(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(getDashboardStatsRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const getStudentAttendanceStatsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'getStudentAttendanceStats', inputVars);
}
getStudentAttendanceStatsRef.operationName = 'getStudentAttendanceStats';
exports.getStudentAttendanceStatsRef = getStudentAttendanceStatsRef;

exports.getStudentAttendanceStats = function getStudentAttendanceStats(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(getStudentAttendanceStatsRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const getWeeklyFrequencyRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'getWeeklyFrequency', inputVars);
}
getWeeklyFrequencyRef.operationName = 'getWeeklyFrequency';
exports.getWeeklyFrequencyRef = getWeeklyFrequencyRef;

exports.getWeeklyFrequency = function getWeeklyFrequency(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(getWeeklyFrequencyRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;
