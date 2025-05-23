import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { Elysia } from "elysia";
import { setupCourseRoutes } from "../../api/course";
import { setupAuth } from "../../middleware/auth";
import { courseService } from "../../services/course";
import { ROLES, PERMISSIONS } from "../../utils/roles";

// Mock the course service
vi.mock("../../services/course", () => ({
    courseService: {
        getAllCourses: vi.fn(),
        getCourseById: vi.fn(),
        getCoursesByOwnerId: vi.fn(),
        createCourse: vi.fn(),
        updateCourse: vi.fn(),
        deleteCourse: vi.fn(),
        getCoursesByUserAccess: vi.fn(),
    }
}));

// Mock the module service
vi.mock("../../services/module", () => ({
    moduleService: {
        getModuleById: vi.fn(),
    }
}));

// Mock the auth middleware
vi.mock("../../middleware/auth", () => ({
    setupAuth: () => {
        return new Elysia()
            .derive(() => ({
                requireAuth: vi.fn().mockImplementation(() => Promise.resolve({
                    sub: "1",
                    roles: [ROLES.USER],
                })),
                guardRoles: vi.fn(),
            }));
    }
}));

describe('Course Routes', () => {
    let app: Elysia;

    beforeAll(() => {
        app = new Elysia().use(setupCourseRoutes());
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('GET /list', () => {
        it('should filter courses based on user role', async () => {
            const mockCourses = [{ id: 1, name: 'Course 1' }];

            // Mock the service to return courses
            vi.mocked(courseService.getCoursesByUserAccess).mockResolvedValueOnce(mockCourses);

            const response = await app.handle(new Request('http://localhost/course/list'));
            const body = await response.json();

            expect(response.status).toBe(200);
            expect(body.data).toEqual(mockCourses);
            expect(courseService.getCoursesByUserAccess).toHaveBeenCalledWith(1, [ROLES.USER]);
        });
    });

    describe('GET /get/:courseId', () => {
        it('should return a course if user has access', async () => {
            const mockCourse = {
                id: 1,
                name: 'Course 1',
                public: true,
                owner_id: 2 // Different from user ID
            };

            // Mock the service to return a course
            vi.mocked(courseService.getCourseById).mockResolvedValueOnce(mockCourse);

            const response = await app.handle(new Request('http://localhost/course/get/1'));
            const body = await response.json();

            expect(response.status).toBe(200);
            expect(body.data).toEqual(mockCourse);
        });

        it('should return 403 if user does not have access', async () => {
            const mockCourse = {
                id: 1,
                name: 'Course 1',
                public: false, // Private course
                owner_id: 2 // Different from user ID
            };

            // Mock the service to return a private course
            vi.mocked(courseService.getCourseById).mockResolvedValueOnce(mockCourse);

            // Mock the auth to return a different user without admin privileges
            vi.mocked(app.store?.requireAuth).mockImplementationOnce(() => Promise.resolve({
                sub: "3", // Different from owner_id
                roles: [ROLES.USER], // Not an admin
            }));

            const response = await app.handle(new Request('http://localhost/course/get/1'));
            const body = await response.json();

            expect(response.status).toBe(403);
            expect(body.error).toBeTruthy();
        });
    });

    // More tests could be added for other routes
});
