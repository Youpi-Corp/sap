import { CourseModel, ICourse } from "../db/schema"; // Updated import
import { NotFoundError, ApiError } from "../middleware/error";
import mongoose from 'mongoose'; // Import mongoose for ObjectId

export interface NewCourse { // This can be a subset of ICourse for creation
  name: string;
  content: string;
  module_id: mongoose.Schema.Types.ObjectId | string;
  level?: number;
  likes?: number;
  views?: number;
  public?: boolean;
  chat_id?: mongoose.Schema.Types.ObjectId | string | null;
}

export class CourseService {
  /**
   * Create a new course
   * @param courseData Course data
   * @returns Created course
   */
  async createCourse(courseData: NewCourse): Promise<ICourse> {
    const newCourse = new CourseModel(courseData);
    await newCourse.save();
    return newCourse;
  }

  /**
   * Get a course by ID
   * @param id Course ID (string for MongoDB ObjectId)
   * @returns Course
   */
  async getCourseById(id: string): Promise<ICourse> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError("Invalid course ID format", 400);
    }
    const course = await CourseModel.findById(id);

    if (!course) {
      throw new NotFoundError("Course not found");
    }

    return course;
  }

  /**
   * Get all courses
   * @returns Array of courses
   */
  async getAllCourses(): Promise<ICourse[]> {
    return await CourseModel.find();
  }

  /**
   * Update a course
   * @param id Course ID (string for MongoDB ObjectId)
   * @param courseData Course data to update
   * @returns Updated course
   */
  async updateCourse(id: string, courseData: Partial<NewCourse>): Promise<ICourse> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError("Invalid course ID format", 400);
    }
    const updatedCourse = await CourseModel.findByIdAndUpdate(id, courseData, { new: true });

    if (!updatedCourse) {
      throw new NotFoundError("Course not found");
    }

    return updatedCourse;
  }

  /**
   * Delete a course
   * @param id Course ID (string for MongoDB ObjectId)
   * @returns True if course was deleted
   */
  async deleteCourse(id: string): Promise<boolean> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError("Invalid course ID format", 400);
    }
    const result = await CourseModel.findByIdAndDelete(id);
    return !!result;
  }

  /**
   * Get courses by module ID
   * @param id Module ID (string for MongoDB ObjectId)
   * @returns Array of courses
   */
  async getCoursesByid(id: string): Promise<ICourse[]> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError("Invalid module ID format", 400);
    }
    return await CourseModel.find({ module_id: id });
  }

  // Add other course-specific methods here, e.g., incrementLikes, incrementViews
  async incrementLikes(id: string): Promise<ICourse> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError("Invalid course ID format", 400);
    }
    const course = await CourseModel.findByIdAndUpdate(id, { $inc: { likes: 1 } }, { new: true });
    if (!course) {
      throw new NotFoundError("Course not found");
    }
    return course;
  }

  async incrementViews(id: string): Promise<ICourse> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError("Invalid course ID format", 400);
    }
    const course = await CourseModel.findByIdAndUpdate(id, { $inc: { views: 1 } }, { new: true });
    if (!course) {
      throw new NotFoundError("Course not found");
    }
    return course;
  }
}

// Export a singleton instance
export const courseService = new CourseService();