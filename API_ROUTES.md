# API Routes Documentation

This document provides an overview of all API routes in the Brainforest application, including their parameters, request bodies, and descriptions.

## Table of Contents

- [Authentication Routes](#authentication-routes)
- [User Routes](#user-routes)
- [Role Routes](#role-routes)
- [Module Routes](#module-routes)
- [Module Comment Routes](#module-comment-routes)
- [Course Routes](#course-routes)
- [Info Routes](#info-routes)

## Authentication Routes

Base path: `/auth`

### POST /auth/login

**Description**: Authenticate a user with email and password

**Request Body**:

```json
{
  "email": "string",
  "password": "string"
}
```

**Responses**:

- `200`: Login successful
- `401`: Invalid credentials

### POST /auth/register

**Description**: Register a new user account

**Request Body**:

```json
{
  "pseudo": "string", // Optional
  "email": "string",
  "password": "string"
}
```

**Responses**:

- `201`: User created successfully
- `400`: Invalid request data
- `409`: Email already in use

### POST /auth/logout

**Description**: Logout the current user

**Responses**:

- `200`: Successfully logged out

### GET /auth/me

**Description**: Get the profile of the currently authenticated user

**Responses**:

- `200`: User profile retrieved successfully
- `401`: Not authenticated
- `404`: User not found

## User Routes

Base path: `/user`

### GET /user/me

**Description**: Retrieve the profile of the currently authenticated user

**Responses**:

- `200`: User profile retrieved successfully
- `401`: Authentication required

### GET /user/get/:userId

**Description**: Retrieve a user's profile by their ID

**Path Parameters**:

- `userId`: User ID

**Responses**:

- `200`: User found
- `401`: Authentication required
- `404`: User not found

### GET /user/get_by_email/:email

**Description**: Retrieve a user's profile by their email address

**Path Parameters**:

- `email`: Email address

**Responses**:

- `200`: User found
- `401`: Authentication required
- `404`: User not found

### GET /user/get_email_used/:email

**Description**: Check if an email address is already registered

**Path Parameters**:

- `email`: Email address

**Responses**:

- `200`: Email is already in use
- `404`: Email is not in use

### POST /user/create

**Description**: Create a new user (Admin only)

**Request Body**:

```json
{
  "pseudo": "string", // Optional
  "email": "string",
  "password": "string",
  "roles": ["string"] // Optional
}
```

**Responses**:

- `201`: User created successfully
- `409`: Email already in use

### GET /user/list

**Description**: Get a list of all users in the system (Admin only)

**Responses**:

- `200`: List of users retrieved successfully
- `401`: Authentication required
- `403`: Forbidden - Admin role required

### DELETE /user/delete/:userId

**Description**: Delete a user by ID (Admin only)

**Path Parameters**:

- `userId`: User ID

**Responses**:

- `200`: User deleted successfully
- `404`: User not found

### PUT /user/update/:userId

**Description**: Update a user's profile

**Path Parameters**:

- `userId`: User ID

**Request Body**:

```json
{
  "pseudo": "string", // Optional
  "email": "string", // Optional
  "password": "string", // Optional
  "roles": ["string"] // Optional
}
```

**Responses**:

- `200`: User updated successfully
- `404`: User not found

## Role Routes

Base path: `/role`

### GET /role/list

**Description**: Get a list of all available roles (Admin only)

**Responses**:

- `200`: List of roles retrieved successfully
- `401`: Authentication required
- `403`: Forbidden - Admin role required

### GET /role/get/:roleId

**Description**: Retrieve role details by ID (Admin only)

**Path Parameters**:

- `roleId`: Role ID

**Responses**:

- `200`: Role details retrieved successfully
- `401`: Authentication required
- `403`: Forbidden - Admin role required
- `404`: Role not found

### POST /role/create

**Description**: Create a new role in the system (Admin only)

**Request Body**:

```json
{
  "name": "string",
  "description": "string" // Optional
}
```

**Responses**:

- `201`: Role created successfully
- `400`: Invalid role data
- `401`: Authentication required
- `403`: Forbidden - Admin role required
- `409`: Role with this name already exists

### PUT /role/update/:roleId

**Description**: Update an existing role (Admin only)

**Path Parameters**:

- `roleId`: Role ID

**Request Body**:

```json
{
  "name": "string", // Optional
  "description": "string" // Optional
}
```

**Responses**:

- `200`: Role updated successfully
- `400`: Invalid role data or cannot modify predefined role
- `401`: Authentication required
- `403`: Forbidden - Admin role required
- `404`: Role not found

### DELETE /role/delete/:roleId

**Description**: Delete a role by ID (Admin only, cannot delete predefined roles)

**Path Parameters**:

- `roleId`: Role ID

**Responses**:

- `200`: Role deleted successfully
- `400`: Cannot delete a predefined role
- `401`: Authentication required
- `403`: Forbidden - Admin role required
- `404`: Role not found

### POST /role/assign

**Description**: Assign a role to a specific user (Admin only)

**Request Body**:

```json
{
  "userId": "number",
  "roleId": "number"
}
```

**Responses**:

- `200`: Role assignment status
- `401`: Authentication required
- `403`: Forbidden - Admin role required
- `404`: User or role not found

### DELETE /role/remove

**Description**: Remove a role from a specific user (Admin only)

**Request Body**:

```json
{
  "userId": "number",
  "roleId": "number"
}
```

**Responses**:

- `200`: Role removal status
- `401`: Authentication required
- `403`: Forbidden - Admin role required
- `404`: User or role not found

### GET /role/user/:userId

**Description**: Get all roles assigned to a specific user (Users can view their own roles, admin can view any user's roles)

**Path Parameters**:

- `userId`: User ID

**Responses**:

- `200`: List of roles retrieved successfully
- `401`: Authentication required
- `403`: Forbidden - Not authorized to view this user's roles
- `404`: User not found

## Module Routes

Base path: `/module`

### GET /module/list

**Description**: Retrieve a list of modules. Admins see all modules (public and private), regular users see only public modules (requires authentication)

**Responses**:

- `200`: List of modules retrieved successfully
- `401`: Authentication required

### GET /module/public

**Description**: Retrieve a list of all public modules (no authentication required)

**Responses**:

- `200`: List of public modules retrieved successfully

### GET /module/get/:moduleId

**Description**: Retrieve a module by its ID. If the module is private, only the owner or admin can access it. Public modules can be accessed by anyone.

**Path Parameters**:

- `moduleId`: Module ID

**Responses**:

- `200`: Module found
- `401`: Authentication required
- `403`: Not authorized to access this module
- `404`: Module not found

### GET /module/owner/:ownerId

**Description**: Retrieve all modules created by a specific owner

**Path Parameters**:

- `ownerId`: Owner's user ID

**Responses**:

- `200`: Modules found
- `401`: Authentication required

### GET /module/subscribed

**Description**: Retrieve all modules the authenticated user is subscribed to

**Responses**:

- `200`: Subscribed modules found
- `401`: Authentication required

### GET /module/is-subscribed/:moduleId

**Description**: Check if the authenticated user is subscribed to a specific module

**Path Parameters**:

- `moduleId`: Module ID

**Responses**:

- `200`: Subscription status retrieved
- `401`: Authentication required

### POST /module/create

**Description**: Create a new module

**Request Body**:

```json
{
  "title": "string",
  "description": "string", // Optional
  "public": "boolean" // Optional
}
```

**Responses**:

- `201`: Module created successfully
- `401`: Authentication required

### PUT /module/update/:moduleId

**Description**: Update a module by its ID

**Path Parameters**:

- `moduleId`: Module ID

**Request Body**:

```json
{
  "title": "string", // Optional
  "description": "string", // Optional
  "public": "boolean" // Optional
}
```

**Responses**:

- `200`: Module updated successfully
- `401`: Authentication required
- `404`: Module not found

### POST /module/add-course/:moduleId/:courseId

**Description**: Associate a course with a module

**Path Parameters**:

- `moduleId`: Module ID
- `courseId`: Course ID

**Responses**:

- `200`: Course added successfully
- `401`: Authentication required
- `403`: Not authorized to modify this module
- `404`: Module or course not found

### DELETE /module/remove-course/:moduleId/:courseId

**Description**: Remove a course association from a module

**Path Parameters**:

- `moduleId`: Module ID
- `courseId`: Course ID

**Responses**:

- `200`: Course removed successfully
- `401`: Authentication required
- `403`: Not authorized to modify this module
- `404`: Module or course not found

### GET /module/courses/:moduleId

**Description**: Get all courses associated with a module

**Path Parameters**:

- `moduleId`: Module ID

**Responses**:

- `200`: Courses retrieved successfully
- `401`: Authentication required
- `404`: Module not found

### POST /module/subscribe/:moduleId

**Description**: Subscribe the authenticated user to a specific module

**Path Parameters**:

- `moduleId`: Module ID

**Responses**:

- `200`: Subscription status
- `401`: Authentication required
- `404`: Module not found

### DELETE /module/unsubscribe/:moduleId

**Description**: Unsubscribe the authenticated user from a specific module

**Path Parameters**:

- `moduleId`: Module ID

**Responses**:

- `200`: Unsubscription status
- `401`: Authentication required

### DELETE /module/delete/:moduleId

**Description**: Delete a module by its ID

**Path Parameters**:

- `moduleId`: Module ID

**Responses**:

- `200`: Module deleted successfully
- `401`: Authentication required
- `404`: Module not found

## Module Comment Routes

Base path: `/module-comment`

### GET /module-comment/:moduleId

**Description**: Retrieve all comments for a specific module

**Path Parameters**:

- `moduleId`: Module ID

**Responses**:

- `200`: Comments retrieved successfully

### GET /module-comment/comment/:commentId

**Description**: Retrieve a specific comment by its ID

**Path Parameters**:

- `commentId`: Comment ID

**Responses**:

- `200`: Comment retrieved successfully
- `404`: Comment not found

### POST /module-comment/create

**Description**: Create a new comment on a module

**Request Body**:

```json
{
  "content": "string", // Min length: 1, Max length: 5000
  "module_id": "number"
}
```

**Responses**:

- `201`: Comment created successfully
- `401`: Authentication required
- `404`: Module not found

### PUT /module-comment/update/:commentId

**Description**: Update a comment (only owner or admin can update)

**Path Parameters**:

- `commentId`: Comment ID

**Request Body**:

```json
{
  "content": "string" // Min length: 1, Max length: 5000
}
```

**Responses**:

- `200`: Comment updated successfully
- `401`: Authentication required
- `403`: Not authorized to update this comment
- `404`: Comment not found

### DELETE /module-comment/delete/:commentId

**Description**: Delete a comment (only owner or admin can delete)

**Path Parameters**:

- `commentId`: Comment ID

**Responses**:

- `200`: Comment deleted successfully
- `401`: Authentication required
- `403`: Not authorized to delete this comment
- `404`: Comment not found

### GET /module-comment/user/:userId

**Description**: Retrieve all comments made by a specific user

**Path Parameters**:

- `userId`: User ID

**Responses**:

- `200`: Comments retrieved successfully
- `401`: Authentication required

## Course Routes

Base path: `/course`

### GET /course/list

**Description**: Retrieve a list of courses based on user permissions. Admins see all courses, while regular users only see public courses and their own courses.

**Responses**:

- `200`: List of courses retrieved successfully
- `401`: Authentication required

### GET /course/get/:courseId

**Description**: Retrieve a course by its ID. User can access a course if it's public, they own it, or they're an admin.

**Path Parameters**:

- `courseId`: Course ID

**Responses**:

- `200`: Course found
- `401`: Authentication required
- `403`: Forbidden - User does not have permission to access this course
- `404`: Course not found

### POST /course/create

**Description**: Create a new course. User must either own the module or be an admin. Additionally, the user must have the CREATE_COURSE permission or have a TEACHER or ADMIN role.

**Request Body**:

```json
{
  "name": "string",
  "content": "string",
  "module_id": "number",
  "level": "number",
  "public": "boolean"
}
```

**Responses**:

- `201`: Course created successfully
- `401`: Authentication required
- `403`: Not authorized to create courses in this module
- `404`: Module not found

### GET /course/owner/:ownerId

**Description**: Retrieve courses created by a specific owner. Returns all courses if requesting your own courses or if you're an admin. Otherwise, returns only public courses.

**Path Parameters**:

- `ownerId`: Owner's user ID

**Responses**:

- `200`: Courses found
- `401`: Authentication required

### PUT /course/update/:courseId

**Description**: Update a course by its ID. User can update a course if they own it or have admin privileges.

**Path Parameters**:

- `courseId`: Course ID

**Request Body**:

```json
{
  "name": "string", // Optional
  "content": "string", // Optional
  "module_id": "number", // Optional
  "level": "number", // Optional
  "public": "boolean" // Optional
}
```

**Responses**:

- `200`: Course updated successfully
- `401`: Authentication required
- `403`: Not authorized to update this course
- `404`: Course not found

### DELETE /course/delete/:courseId

**Description**: Delete a course by its ID. User can delete a course if they own it or have admin privileges.

**Path Parameters**:

- `courseId`: Course ID

**Responses**:

- `200`: Course deleted successfully
- `401`: Authentication required
- `403`: Not authorized to delete this course
- `404`: Course not found

## Info Routes

Base path: `/info`

### GET /info/get

**Description**: Retrieve general information about the platform including terms and legal notices

**Responses**:

- `200`: Information retrieved successfully
- `404`: Information not found

### GET /info/alive

**Description**: Simple endpoint to check if the service is running

**Responses**:

- `200`: Service is running

### PUT /info/update

**Description**: Update general platform information (Admin role required)

**Request Body**:

```json
{
  "cgu": "string", // Optional
  "legal_mentions": "string" // Optional
}
```

**Responses**:

- `200`: Information updated successfully
- `401`: Not authenticated
- `403`: Not authorized (Admin role required)
