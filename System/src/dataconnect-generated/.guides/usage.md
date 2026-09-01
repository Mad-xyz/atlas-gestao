# Basic Usage

Always prioritize using a supported framework over using the generated SDK
directly. Supported frameworks simplify the developer experience and help ensure
best practices are followed.





## Advanced Usage
If a user is not using a supported framework, they can use the generated SDK directly.

Here's an example of how to use it with the first 5 operations:

```js
import { getLatestAttendance, getAttendanceCountInRange, getDashboardStats, getStudentAttendanceStats, getWeeklyFrequency } from '@dataconnect/generated';


// Operation GetLatestAttendance:  For variables, look at type GetLatestAttendanceVars in ../index.d.ts
const { data } = await GetLatestAttendance(dataConnect, getLatestAttendanceVars);

// Operation GetAttendanceCountInRange:  For variables, look at type GetAttendanceCountInRangeVars in ../index.d.ts
const { data } = await GetAttendanceCountInRange(dataConnect, getAttendanceCountInRangeVars);

// Operation getDashboardStats:  For variables, look at type GetDashboardStatsVars in ../index.d.ts
const { data } = await GetDashboardStats(dataConnect, getDashboardStatsVars);

// Operation getStudentAttendanceStats:  For variables, look at type GetStudentAttendanceStatsVars in ../index.d.ts
const { data } = await GetStudentAttendanceStats(dataConnect, getStudentAttendanceStatsVars);

// Operation getWeeklyFrequency:  For variables, look at type GetWeeklyFrequencyVars in ../index.d.ts
const { data } = await GetWeeklyFrequency(dataConnect, getWeeklyFrequencyVars);


```