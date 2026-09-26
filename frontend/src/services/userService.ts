import { apiClient } from './api';
import { ENDPOINTS } from '../constants/apiEndpoints';
import type { ApiResponse, PaginatedResponse } from '../types/api';
import type {
  UserDto,
  CreateUserRequest,
  UpdateUserRequest,
  UserFilterParams,
} from '../types/user';

let mockUsers: UserDto[] = [
  {
    id: 1,
    bankId: null,
    firstName: 'Alex',
    lastName: 'Vance',
    email: 'superadmin@atmopt.bank',
    phone: '+1 555-0100',
    role: 'SUPER_ADMIN',
    status: 'ACTIVE',
    createdAt: '2026-08-01T08:00:00Z',
    updatedAt: '2026-08-01T08:00:00Z',
  },
  {
    id: 2,
    bankId: 1,
    firstName: 'Sarah',
    lastName: 'Connor',
    email: 'bankadmin@metrobank.com',
    phone: '+1 555-0101',
    role: 'BANK_ADMIN',
    status: 'ACTIVE',
    createdAt: '2026-08-05T09:30:00Z',
    updatedAt: '2026-08-05T09:30:00Z',
  },
  {
    id: 3,
    bankId: 1,
    firstName: 'Marcus',
    lastName: 'Wright',
    email: 'manager@metrobank.com',
    phone: '+1 555-0102',
    role: 'BANK_MANAGER',
    status: 'ACTIVE',
    createdAt: '2026-08-10T11:15:00Z',
    updatedAt: '2026-08-10T11:15:00Z',
  },
  {
    id: 4,
    bankId: 1,
    firstName: 'Kyle',
    lastName: 'Reese',
    email: 'operator@metrobank.com',
    phone: '+1 555-0103',
    role: 'ATM_OPERATOR',
    status: 'ACTIVE',
    createdAt: '2026-08-15T14:20:00Z',
    updatedAt: '2026-08-15T14:20:00Z',
  },
  {
    id: 5,
    bankId: 2,
    firstName: 'Elena',
    lastName: 'Rostova',
    email: 'elena.r@apexbank.com',
    phone: '+1 555-0104',
    role: 'BANK_ADMIN',
    status: 'INACTIVE',
    createdAt: '2026-08-20T10:00:00Z',
    updatedAt: '2026-08-25T16:45:00Z',
  },
  {
    id: 6,
    bankId: 1,
    firstName: 'David',
    lastName: 'Kim',
    email: 'david.k@metrobank.com',
    phone: '+1 555-0105',
    role: 'ATM_OPERATOR',
    status: 'LOCKED',
    createdAt: '2026-08-22T13:10:00Z',
    updatedAt: '2026-08-28T09:00:00Z',
  },
];

export const userService = {
  async getUsers(params?: UserFilterParams): Promise<PaginatedResponse<UserDto>> {
    try {
      const response = await apiClient.get<ApiResponse<PaginatedResponse<UserDto>>>(
        ENDPOINTS.USERS.LIST,
        { params }
      );
      return response.data.data;
    } catch {
      let filtered = [...mockUsers];

      if (params?.search) {
        const query = params.search.toLowerCase();
        filtered = filtered.filter(
          (u) =>
            u.firstName.toLowerCase().includes(query) ||
            u.lastName.toLowerCase().includes(query) ||
            u.email.toLowerCase().includes(query)
        );
      }

      if (params?.role) {
        filtered = filtered.filter((u) => u.role === params.role);
      }

      if (params?.status) {
        filtered = filtered.filter((u) => u.status === params.status);
      }

      const page = params?.page ?? 0;
      const size = params?.size ?? 10;
      const totalElements = filtered.length;
      const totalPages = Math.max(1, Math.ceil(totalElements / size));
      const start = page * size;
      const content = filtered.slice(start, start + size);

      return {
        content,
        page,
        size,
        totalElements,
        totalPages,
        first: page === 0,
        last: page >= totalPages - 1,
      };
    }
  },

  async getUserById(id: number | string): Promise<UserDto> {
    const numId = Number(id);
    try {
      const response = await apiClient.get<ApiResponse<UserDto>>(
        ENDPOINTS.USERS.DETAIL(id)
      );
      return response.data.data;
    } catch {
      const found = mockUsers.find((u) => u.id === numId);
      if (!found) {
        throw new Error(`User with ID ${id} not found`);
      }
      return found;
    }
  },

  async createUser(payload: CreateUserRequest): Promise<UserDto> {
    try {
      const response = await apiClient.post<ApiResponse<UserDto>>(
        ENDPOINTS.USERS.CREATE,
        payload
      );
      return response.data.data;
    } catch {
      const newUser: UserDto = {
        id: Math.max(...mockUsers.map((u) => u.id), 0) + 1,
        bankId: payload.bankId ?? null,
        firstName: payload.firstName,
        lastName: payload.lastName,
        email: payload.email,
        phone: payload.phone,
        role: payload.role,
        status: payload.status,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockUsers.unshift(newUser);
      return newUser;
    }
  },

  async updateUser(id: number | string, payload: UpdateUserRequest): Promise<UserDto> {
    const numId = Number(id);
    try {
      const response = await apiClient.put<ApiResponse<UserDto>>(
        ENDPOINTS.USERS.UPDATE(id),
        payload
      );
      return response.data.data;
    } catch {
      const idx = mockUsers.findIndex((u) => u.id === numId);
      if (idx === -1) {
        throw new Error(`User with ID ${id} not found`);
      }
      const updated: UserDto = {
        ...mockUsers[idx],
        ...payload,
        updatedAt: new Date().toISOString(),
      };
      mockUsers[idx] = updated;
      return updated;
    }
  },

  async deleteUser(id: number | string): Promise<void> {
    const numId = Number(id);
    try {
      await apiClient.delete<ApiResponse<void>>(ENDPOINTS.USERS.DELETE(id));
    } catch {
      mockUsers = mockUsers.filter((u) => u.id !== numId);
    }
  },
};
