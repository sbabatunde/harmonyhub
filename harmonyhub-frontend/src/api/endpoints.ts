export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    USER: '/user',
    UPDATE_PROFILE: '/user/profile',
  },
  SONGS: {
    LIST: '/songs',
    DETAIL: (id: number) => `/songs/${id}`,
    CREATE: '/songs',
    UPDATE: (id: number) => `/songs/${id}`,
    DELETE: (id: number) => `/songs/${id}`,
    PARTS: (songId: number) => `/songs/${songId}/parts`,
    PART_DETAIL: (songId: number, partId: number) => `/songs/${songId}/parts/${partId}`,
  },
  PRACTICE: {
    SESSIONS: '/practice/sessions',
    SESSION_DETAIL: (id: number) => `/practice/sessions/${id}`,
    STATISTICS: '/practice/statistics',
  },
  CURRICULUM: {
    STAGES: '/curriculum',
    STAGE_DETAIL: (id: number) => `/curriculum/${id}`,
    PROGRESS: '/curriculum/progress',
    UPDATE_PROGRESS: (stageId: number) => `/curriculum/${stageId}/progress`,
  },
  ASSIGNMENTS: {
    LIST: '/assignments',
    CREATE: '/assignments',
    DETAIL: (id: number) => `/assignments/${id}`,
    COMPLETE: (id: number) => `/assignments/${id}/complete`,
    DELETE: (id: number) => `/assignments/${id}`,
  },
  GAMES: {
    SUBMIT_SCORE: '/games/scores',
    USER_SCORES: '/games/scores',
    LEADERBOARD: (gameType: string) => `/games/leaderboard/${gameType}`,
    STATISTICS: '/games/statistics',
  },
  TEACHER: {
    STUDENTS: '/teacher/students',
    STUDENT_DETAILS: (id: number) => `/teacher/students/${id}`,
    STUDENT_PROGRESS: (id: number) => `/teacher/students/${id}/progress`,
    STUDENT_ASSIGNMENTS: (id: number) => `/teacher/students/${id}/assignments`,
    STATISTICS: '/teacher/statistics',
  },
} as const;