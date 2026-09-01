# Generated TypeScript README
This README will guide you through the process of using the generated JavaScript SDK package for the connector `attendance`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

# Table of Contents
- [**Overview**](#generated-javascript-readme)
- [**Accessing the connector**](#accessing-the-connector)
  - [*Connecting to the local Emulator*](#connecting-to-the-local-emulator)
- [**Queries**](#queries)
  - [*GetLatestAttendance*](#getlatestattendance)
  - [*GetAttendanceCountInRange*](#getattendancecountinrange)
  - [*getDashboardStats*](#getdashboardstats)
  - [*getStudentAttendanceStats*](#getstudentattendancestats)
  - [*getWeeklyFrequency*](#getweeklyfrequency)
- [**Mutations**](#mutations)

# Accessing the connector
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `attendance`. You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

You can use this generated SDK by importing from the package `@dataconnect/generated` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#set-client).

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#instrument-clients).

```typescript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
connectDataConnectEmulator(dataConnect, 'localhost', 9399);
```

After it's initialized, you can call your Data Connect [queries](#queries) and [mutations](#mutations) from your generated SDK.

# Queries

There are two ways to execute a Data Connect Query using the generated Web SDK:
- Using a Query Reference function, which returns a `QueryRef`
  - The `QueryRef` can be used as an argument to `executeQuery()`, which will execute the Query and return a `QueryPromise`
- Using an action shortcut function, which returns a `QueryPromise`
  - Calling the action shortcut function will execute the Query and return a `QueryPromise`

The following is true for both the action shortcut function and the `QueryRef` function:
- The `QueryPromise` returned will resolve to the result of the Query once it has finished executing
- If the Query accepts arguments, both the action shortcut function and the `QueryRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Query
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `attendance` connector's generated functions to execute each query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-queries).

## GetLatestAttendance
You can execute the `GetLatestAttendance` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getLatestAttendance(vars: GetLatestAttendanceVariables, options?: ExecuteQueryOptions): QueryPromise<GetLatestAttendanceData, GetLatestAttendanceVariables>;

interface GetLatestAttendanceRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetLatestAttendanceVariables): QueryRef<GetLatestAttendanceData, GetLatestAttendanceVariables>;
}
export const getLatestAttendanceRef: GetLatestAttendanceRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getLatestAttendance(dc: DataConnect, vars: GetLatestAttendanceVariables, options?: ExecuteQueryOptions): QueryPromise<GetLatestAttendanceData, GetLatestAttendanceVariables>;

interface GetLatestAttendanceRef {
  ...
  (dc: DataConnect, vars: GetLatestAttendanceVariables): QueryRef<GetLatestAttendanceData, GetLatestAttendanceVariables>;
}
export const getLatestAttendanceRef: GetLatestAttendanceRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getLatestAttendanceRef:
```typescript
const name = getLatestAttendanceRef.operationName;
console.log(name);
```

### Variables
The `GetLatestAttendance` query requires an argument of type `GetLatestAttendanceVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetLatestAttendanceVariables {
  studentId: string;
}
```
### Return Type
Recall that executing the `GetLatestAttendance` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetLatestAttendanceData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface GetLatestAttendanceData {
  eventParticipants: ({
    registeredAt: TimestampString;
  })[];
}
```
### Using `GetLatestAttendance`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getLatestAttendance, GetLatestAttendanceVariables } from '@dataconnect/generated';

// The `GetLatestAttendance` query requires an argument of type `GetLatestAttendanceVariables`:
const getLatestAttendanceVars: GetLatestAttendanceVariables = {
  studentId: ..., 
};

// Call the `getLatestAttendance()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getLatestAttendance(getLatestAttendanceVars);
// Variables can be defined inline as well.
const { data } = await getLatestAttendance({ studentId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getLatestAttendance(dataConnect, getLatestAttendanceVars);

console.log(data.eventParticipants);

// Or, you can use the `Promise` API.
getLatestAttendance(getLatestAttendanceVars).then((response) => {
  const data = response.data;
  console.log(data.eventParticipants);
});
```

### Using `GetLatestAttendance`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getLatestAttendanceRef, GetLatestAttendanceVariables } from '@dataconnect/generated';

// The `GetLatestAttendance` query requires an argument of type `GetLatestAttendanceVariables`:
const getLatestAttendanceVars: GetLatestAttendanceVariables = {
  studentId: ..., 
};

// Call the `getLatestAttendanceRef()` function to get a reference to the query.
const ref = getLatestAttendanceRef(getLatestAttendanceVars);
// Variables can be defined inline as well.
const ref = getLatestAttendanceRef({ studentId: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getLatestAttendanceRef(dataConnect, getLatestAttendanceVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.eventParticipants);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.eventParticipants);
});
```

## GetAttendanceCountInRange
You can execute the `GetAttendanceCountInRange` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getAttendanceCountInRange(vars: GetAttendanceCountInRangeVariables, options?: ExecuteQueryOptions): QueryPromise<GetAttendanceCountInRangeData, GetAttendanceCountInRangeVariables>;

interface GetAttendanceCountInRangeRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetAttendanceCountInRangeVariables): QueryRef<GetAttendanceCountInRangeData, GetAttendanceCountInRangeVariables>;
}
export const getAttendanceCountInRangeRef: GetAttendanceCountInRangeRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getAttendanceCountInRange(dc: DataConnect, vars: GetAttendanceCountInRangeVariables, options?: ExecuteQueryOptions): QueryPromise<GetAttendanceCountInRangeData, GetAttendanceCountInRangeVariables>;

interface GetAttendanceCountInRangeRef {
  ...
  (dc: DataConnect, vars: GetAttendanceCountInRangeVariables): QueryRef<GetAttendanceCountInRangeData, GetAttendanceCountInRangeVariables>;
}
export const getAttendanceCountInRangeRef: GetAttendanceCountInRangeRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getAttendanceCountInRangeRef:
```typescript
const name = getAttendanceCountInRangeRef.operationName;
console.log(name);
```

### Variables
The `GetAttendanceCountInRange` query requires an argument of type `GetAttendanceCountInRangeVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetAttendanceCountInRangeVariables {
  studentId: string;
  startDate: TimestampString;
}
```
### Return Type
Recall that executing the `GetAttendanceCountInRange` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetAttendanceCountInRangeData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface GetAttendanceCountInRangeData {
  eventParticipants: ({
    registeredAt: TimestampString;
  })[];
}
```
### Using `GetAttendanceCountInRange`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getAttendanceCountInRange, GetAttendanceCountInRangeVariables } from '@dataconnect/generated';

// The `GetAttendanceCountInRange` query requires an argument of type `GetAttendanceCountInRangeVariables`:
const getAttendanceCountInRangeVars: GetAttendanceCountInRangeVariables = {
  studentId: ..., 
  startDate: ..., 
};

// Call the `getAttendanceCountInRange()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getAttendanceCountInRange(getAttendanceCountInRangeVars);
// Variables can be defined inline as well.
const { data } = await getAttendanceCountInRange({ studentId: ..., startDate: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getAttendanceCountInRange(dataConnect, getAttendanceCountInRangeVars);

console.log(data.eventParticipants);

// Or, you can use the `Promise` API.
getAttendanceCountInRange(getAttendanceCountInRangeVars).then((response) => {
  const data = response.data;
  console.log(data.eventParticipants);
});
```

### Using `GetAttendanceCountInRange`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getAttendanceCountInRangeRef, GetAttendanceCountInRangeVariables } from '@dataconnect/generated';

// The `GetAttendanceCountInRange` query requires an argument of type `GetAttendanceCountInRangeVariables`:
const getAttendanceCountInRangeVars: GetAttendanceCountInRangeVariables = {
  studentId: ..., 
  startDate: ..., 
};

// Call the `getAttendanceCountInRangeRef()` function to get a reference to the query.
const ref = getAttendanceCountInRangeRef(getAttendanceCountInRangeVars);
// Variables can be defined inline as well.
const ref = getAttendanceCountInRangeRef({ studentId: ..., startDate: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getAttendanceCountInRangeRef(dataConnect, getAttendanceCountInRangeVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.eventParticipants);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.eventParticipants);
});
```

## getDashboardStats
You can execute the `getDashboardStats` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getDashboardStats(vars: GetDashboardStatsVariables, options?: ExecuteQueryOptions): QueryPromise<GetDashboardStatsData, GetDashboardStatsVariables>;

interface GetDashboardStatsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetDashboardStatsVariables): QueryRef<GetDashboardStatsData, GetDashboardStatsVariables>;
}
export const getDashboardStatsRef: GetDashboardStatsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getDashboardStats(dc: DataConnect, vars: GetDashboardStatsVariables, options?: ExecuteQueryOptions): QueryPromise<GetDashboardStatsData, GetDashboardStatsVariables>;

interface GetDashboardStatsRef {
  ...
  (dc: DataConnect, vars: GetDashboardStatsVariables): QueryRef<GetDashboardStatsData, GetDashboardStatsVariables>;
}
export const getDashboardStatsRef: GetDashboardStatsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getDashboardStatsRef:
```typescript
const name = getDashboardStatsRef.operationName;
console.log(name);
```

### Variables
The `getDashboardStats` query requires an argument of type `GetDashboardStatsVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetDashboardStatsVariables {
  todayStart: TimestampString;
  fourteenDaysAgo: TimestampString;
}
```
### Return Type
Recall that executing the `getDashboardStats` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetDashboardStatsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `getDashboardStats`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getDashboardStats, GetDashboardStatsVariables } from '@dataconnect/generated';

// The `getDashboardStats` query requires an argument of type `GetDashboardStatsVariables`:
const getDashboardStatsVars: GetDashboardStatsVariables = {
  todayStart: ..., 
  fourteenDaysAgo: ..., 
};

// Call the `getDashboardStats()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getDashboardStats(getDashboardStatsVars);
// Variables can be defined inline as well.
const { data } = await getDashboardStats({ todayStart: ..., fourteenDaysAgo: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getDashboardStats(dataConnect, getDashboardStatsVars);

console.log(data.todayPresences);
console.log(data.recentPresences);

// Or, you can use the `Promise` API.
getDashboardStats(getDashboardStatsVars).then((response) => {
  const data = response.data;
  console.log(data.todayPresences);
  console.log(data.recentPresences);
});
```

### Using `getDashboardStats`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getDashboardStatsRef, GetDashboardStatsVariables } from '@dataconnect/generated';

// The `getDashboardStats` query requires an argument of type `GetDashboardStatsVariables`:
const getDashboardStatsVars: GetDashboardStatsVariables = {
  todayStart: ..., 
  fourteenDaysAgo: ..., 
};

// Call the `getDashboardStatsRef()` function to get a reference to the query.
const ref = getDashboardStatsRef(getDashboardStatsVars);
// Variables can be defined inline as well.
const ref = getDashboardStatsRef({ todayStart: ..., fourteenDaysAgo: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getDashboardStatsRef(dataConnect, getDashboardStatsVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.todayPresences);
console.log(data.recentPresences);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.todayPresences);
  console.log(data.recentPresences);
});
```

## getStudentAttendanceStats
You can execute the `getStudentAttendanceStats` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getStudentAttendanceStats(vars: GetStudentAttendanceStatsVariables, options?: ExecuteQueryOptions): QueryPromise<GetStudentAttendanceStatsData, GetStudentAttendanceStatsVariables>;

interface GetStudentAttendanceStatsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetStudentAttendanceStatsVariables): QueryRef<GetStudentAttendanceStatsData, GetStudentAttendanceStatsVariables>;
}
export const getStudentAttendanceStatsRef: GetStudentAttendanceStatsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getStudentAttendanceStats(dc: DataConnect, vars: GetStudentAttendanceStatsVariables, options?: ExecuteQueryOptions): QueryPromise<GetStudentAttendanceStatsData, GetStudentAttendanceStatsVariables>;

interface GetStudentAttendanceStatsRef {
  ...
  (dc: DataConnect, vars: GetStudentAttendanceStatsVariables): QueryRef<GetStudentAttendanceStatsData, GetStudentAttendanceStatsVariables>;
}
export const getStudentAttendanceStatsRef: GetStudentAttendanceStatsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getStudentAttendanceStatsRef:
```typescript
const name = getStudentAttendanceStatsRef.operationName;
console.log(name);
```

### Variables
The `getStudentAttendanceStats` query requires an argument of type `GetStudentAttendanceStatsVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetStudentAttendanceStatsVariables {
  studentId: string;
  startOfMonth: TimestampString;
}
```
### Return Type
Recall that executing the `getStudentAttendanceStats` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetStudentAttendanceStatsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface GetStudentAttendanceStatsData {
  eventParticipants: ({
    registeredAt: TimestampString;
  })[];
}
```
### Using `getStudentAttendanceStats`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getStudentAttendanceStats, GetStudentAttendanceStatsVariables } from '@dataconnect/generated';

// The `getStudentAttendanceStats` query requires an argument of type `GetStudentAttendanceStatsVariables`:
const getStudentAttendanceStatsVars: GetStudentAttendanceStatsVariables = {
  studentId: ..., 
  startOfMonth: ..., 
};

// Call the `getStudentAttendanceStats()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getStudentAttendanceStats(getStudentAttendanceStatsVars);
// Variables can be defined inline as well.
const { data } = await getStudentAttendanceStats({ studentId: ..., startOfMonth: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getStudentAttendanceStats(dataConnect, getStudentAttendanceStatsVars);

console.log(data.eventParticipants);

// Or, you can use the `Promise` API.
getStudentAttendanceStats(getStudentAttendanceStatsVars).then((response) => {
  const data = response.data;
  console.log(data.eventParticipants);
});
```

### Using `getStudentAttendanceStats`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getStudentAttendanceStatsRef, GetStudentAttendanceStatsVariables } from '@dataconnect/generated';

// The `getStudentAttendanceStats` query requires an argument of type `GetStudentAttendanceStatsVariables`:
const getStudentAttendanceStatsVars: GetStudentAttendanceStatsVariables = {
  studentId: ..., 
  startOfMonth: ..., 
};

// Call the `getStudentAttendanceStatsRef()` function to get a reference to the query.
const ref = getStudentAttendanceStatsRef(getStudentAttendanceStatsVars);
// Variables can be defined inline as well.
const ref = getStudentAttendanceStatsRef({ studentId: ..., startOfMonth: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getStudentAttendanceStatsRef(dataConnect, getStudentAttendanceStatsVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.eventParticipants);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.eventParticipants);
});
```

## getWeeklyFrequency
You can execute the `getWeeklyFrequency` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getWeeklyFrequency(vars: GetWeeklyFrequencyVariables, options?: ExecuteQueryOptions): QueryPromise<GetWeeklyFrequencyData, GetWeeklyFrequencyVariables>;

interface GetWeeklyFrequencyRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetWeeklyFrequencyVariables): QueryRef<GetWeeklyFrequencyData, GetWeeklyFrequencyVariables>;
}
export const getWeeklyFrequencyRef: GetWeeklyFrequencyRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getWeeklyFrequency(dc: DataConnect, vars: GetWeeklyFrequencyVariables, options?: ExecuteQueryOptions): QueryPromise<GetWeeklyFrequencyData, GetWeeklyFrequencyVariables>;

interface GetWeeklyFrequencyRef {
  ...
  (dc: DataConnect, vars: GetWeeklyFrequencyVariables): QueryRef<GetWeeklyFrequencyData, GetWeeklyFrequencyVariables>;
}
export const getWeeklyFrequencyRef: GetWeeklyFrequencyRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getWeeklyFrequencyRef:
```typescript
const name = getWeeklyFrequencyRef.operationName;
console.log(name);
```

### Variables
The `getWeeklyFrequency` query requires an argument of type `GetWeeklyFrequencyVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetWeeklyFrequencyVariables {
  thirtyDaysAgo: TimestampString;
}
```
### Return Type
Recall that executing the `getWeeklyFrequency` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetWeeklyFrequencyData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface GetWeeklyFrequencyData {
  eventParticipants: ({
    registeredAt: TimestampString;
  })[];
}
```
### Using `getWeeklyFrequency`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getWeeklyFrequency, GetWeeklyFrequencyVariables } from '@dataconnect/generated';

// The `getWeeklyFrequency` query requires an argument of type `GetWeeklyFrequencyVariables`:
const getWeeklyFrequencyVars: GetWeeklyFrequencyVariables = {
  thirtyDaysAgo: ..., 
};

// Call the `getWeeklyFrequency()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getWeeklyFrequency(getWeeklyFrequencyVars);
// Variables can be defined inline as well.
const { data } = await getWeeklyFrequency({ thirtyDaysAgo: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getWeeklyFrequency(dataConnect, getWeeklyFrequencyVars);

console.log(data.eventParticipants);

// Or, you can use the `Promise` API.
getWeeklyFrequency(getWeeklyFrequencyVars).then((response) => {
  const data = response.data;
  console.log(data.eventParticipants);
});
```

### Using `getWeeklyFrequency`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getWeeklyFrequencyRef, GetWeeklyFrequencyVariables } from '@dataconnect/generated';

// The `getWeeklyFrequency` query requires an argument of type `GetWeeklyFrequencyVariables`:
const getWeeklyFrequencyVars: GetWeeklyFrequencyVariables = {
  thirtyDaysAgo: ..., 
};

// Call the `getWeeklyFrequencyRef()` function to get a reference to the query.
const ref = getWeeklyFrequencyRef(getWeeklyFrequencyVars);
// Variables can be defined inline as well.
const ref = getWeeklyFrequencyRef({ thirtyDaysAgo: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getWeeklyFrequencyRef(dataConnect, getWeeklyFrequencyVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.eventParticipants);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.eventParticipants);
});
```

# Mutations

No mutations were generated for the `attendance` connector.

If you want to learn more about how to use mutations in Data Connect, you can follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-mutations).

