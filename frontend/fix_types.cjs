const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, search, replacement) {
  const fullPath = path.resolve(__dirname, filePath);
  let content = fs.readFileSync(fullPath, 'utf8');
  const normalizedSearch = typeof search === 'string' ? search.replace(/\r\n/g, '\n') : search;
  const isCrlf = content.includes('\r\n');
  let normalizedContent = content.replace(/\r\n/g, '\n');

  if (typeof normalizedSearch === 'string') {
    if (!normalizedContent.includes(normalizedSearch)) {
      console.warn('Could not find search string in ' + filePath);
      return;
    }
    normalizedContent = normalizedContent.replace(normalizedSearch, replacement.replace(/\r\n/g, '\n'));
  } else {
    normalizedContent = normalizedContent.replace(normalizedSearch, replacement);
  }

  if (isCrlf) {
    normalizedContent = normalizedContent.replace(/\n/g, '\r\n');
  }
  fs.writeFileSync(fullPath, normalizedContent, 'utf8');
  console.log('Updated ' + filePath);
}

// 1. vite.config.ts & vitest.config.ts
fs.writeFileSync(
  path.resolve(__dirname, 'vite.config.ts'),
  `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});
`,
  'utf8'
);

fs.writeFileSync(
  path.resolve(__dirname, 'vitest.config.ts'),
  `import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    testTimeout: 15000,
  },
});
`,
  'utf8'
);

// 2. Card.tsx
replaceInFile(
  'src/components/ui/Card.tsx',
  'export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {',
  "export interface CardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {"
);

// 3. navigation.ts
replaceInFile(
  'src/constants/navigation.ts',
  "import { UserRole } from '../types/auth';",
  "import type { UserRole } from '../types/auth';"
);

// 4. roles.ts
replaceInFile(
  'src/constants/roles.ts',
  "import { UserRole } from '../types/auth';",
  "import type { UserRole } from '../types/auth';"
);

// 5. AuthContext.tsx
replaceInFile(
  'src/context/AuthContext.tsx',
  "import { User, UserRole, LoginRequest } from '../types/auth';",
  "import type { User, UserRole, LoginRequest } from '../types/auth';"
);

// 6. DashboardLayout.tsx
replaceInFile(
  'src/layouts/DashboardLayout.tsx',
  "import { Breadcrumb, BreadcrumbItem } from '../components/ui/Breadcrumb';",
  "import { Breadcrumb, type BreadcrumbItem } from '../components/ui/Breadcrumb';"
);

// 7. Alerts.tsx
replaceInFile(
  'src/pages/Alerts.tsx',
  "import { Table, Column } from '../components/ui/Table';",
  "import { Table, type Column } from '../components/ui/Table';"
);

// 8. ATMs.tsx
replaceInFile(
  'src/pages/ATMs.tsx',
  "import { Table, Column } from '../components/ui/Table';",
  "import { Table, type Column } from '../components/ui/Table';"
);

// 9. CashInventory.tsx
replaceInFile(
  'src/pages/CashInventory.tsx',
  "import { Table, Column } from '../components/ui/Table';",
  "import { Table, type Column } from '../components/ui/Table';"
);

// 10. Refills.tsx
replaceInFile(
  'src/pages/Refills.tsx',
  "import { Table, Column } from '../components/ui/Table';",
  "import { Table, type Column } from '../components/ui/Table';"
);

// 11. Transactions.tsx
replaceInFile(
  'src/pages/Transactions.tsx',
  "import { Table, Column } from '../components/ui/Table';",
  "import { Table, type Column } from '../components/ui/Table';"
);

// 12. UserList.tsx
replaceInFile(
  'src/pages/users/UserList.tsx',
  "import { UserRole, UserStatus } from '../../types/auth';\nimport { UserDto, UserFilterParams } from '../../types/user';",
  "import type { UserRole, UserStatus } from '../../types/auth';\nimport type { UserDto, UserFilterParams } from '../../types/user';"
);
replaceInFile(
  'src/pages/users/UserList.tsx',
  "import { Table, Column } from '../../components/ui/Table';",
  "import { Table, type Column } from '../../components/ui/Table';"
);

// 13. RoleProtectedRoute.tsx
replaceInFile(
  'src/routes/RoleProtectedRoute.tsx',
  "import { UserRole } from '../types/auth';",
  "import type { UserRole } from '../types/auth';"
);

// 14. api.ts
replaceInFile(
  'src/services/api.ts',
  "import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';",
  "import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';"
);
replaceInFile(
  'src/services/api.ts',
  "import { ApiResponse, ApiError } from '../types/api';\nimport { RefreshTokenResponse } from '../types/auth';",
  "import type { ApiResponse, ApiError } from '../types/api';\nimport type { RefreshTokenResponse } from '../types/auth';"
);

// 15. authService.ts
replaceInFile(
  'src/services/authService.ts',
  "import { ApiResponse } from '../types/api';",
  "import type { ApiResponse } from '../types/api';"
);
replaceInFile(
  'src/services/authService.ts',
  `import {
  LoginRequest,
  LoginResponse,
  RefreshTokenResponse,
  User,
} from '../types/auth';`,
  `import type {
  LoginRequest,
  LoginResponse,
  RefreshTokenResponse,
  User,
} from '../types/auth';`
);

// 16. userService.ts
replaceInFile(
  'src/services/userService.ts',
  "import { ApiResponse, PaginatedResponse } from '../types/api';",
  "import type { ApiResponse, PaginatedResponse } from '../types/api';"
);
replaceInFile(
  'src/services/userService.ts',
  `import {
  UserDto,
  CreateUserRequest,
  UpdateUserRequest,
  UserFilterParams,
} from '../types/user';`,
  `import type {
  UserDto,
  CreateUserRequest,
  UpdateUserRequest,
  UserFilterParams,
} from '../types/user';`
);

// 17. user.ts
replaceInFile(
  'src/types/user.ts',
  "import { UserRole, UserStatus } from './auth';",
  "import type { UserRole, UserStatus } from './auth';"
);

// 18. formatters.ts
replaceInFile(
  'src/utils/formatters.ts',
  "import { UserRole, UserStatus } from '../types/auth';",
  "import type { UserRole, UserStatus } from '../types/auth';"
);

// 19. storage.ts
replaceInFile(
  'src/utils/storage.ts',
  "import { User } from '../types/auth';",
  "import type { User } from '../types/auth';"
);

// 20. Tests - remove unused React import
const testFiles = [
  'src/test/loginValidation.test.tsx',
  'src/test/protectedRoutes.test.tsx',
  'src/test/roleRoutes.test.tsx',
  'src/test/unauthorizedAccess.test.tsx',
  'src/test/authFlow.test.tsx',
];

for (const tf of testFiles) {
  replaceInFile(tf, "import React from 'react';\n", '');
}

console.log('All type fixes applied successfully!');
