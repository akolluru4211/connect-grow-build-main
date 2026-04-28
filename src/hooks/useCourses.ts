import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface Course {
  id: string;
  title: string;
  description: string | null;
  instructor_name: string | null;
  instructor_avatar: string | null;
  thumbnail_url: string | null;
  category: string;
  difficulty: string;
  duration_hours: number | null;
  lessons_count: number | null;
  is_published: boolean | null;
  is_free: boolean | null;
  price: number | null;
  created_at: string;
  is_enrolled?: boolean;
  progress_percentage?: number;
}

export interface Lesson {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  content: string | null;
  duration_minutes: number | null;
  order_index: number | null;
  is_free_preview: boolean | null;
  is_completed?: boolean;
}

export function useCourses() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: courses, isLoading } = useQuery({
    queryKey: ["courses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("is_published", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get enrollment info for each course
      const coursesWithEnrollment = await Promise.all(
        (data || []).map(async (course) => {
          let isEnrolled = false;
          let progressPercentage = 0;

          if (user) {
            const { data: enrollment } = await supabase
              .from("course_enrollments")
              .select("progress_percentage")
              .eq("course_id", course.id)
              .eq("user_id", user.id)
              .maybeSingle();

            if (enrollment) {
              isEnrolled = true;
              progressPercentage = enrollment.progress_percentage || 0;
            }
          }

          return {
            ...course,
            is_enrolled: isEnrolled,
            progress_percentage: progressPercentage,
          } as Course;
        })
      );

      return coursesWithEnrollment;
    },
  });

  const { data: enrolledCourses } = useQuery({
    queryKey: ["enrolled-courses", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data: enrollments, error } = await supabase
        .from("course_enrollments")
        .select("course_id, progress_percentage, enrolled_at")
        .eq("user_id", user.id);

      if (error) throw error;

      const courseIds = enrollments?.map((e) => e.course_id) || [];
      if (courseIds.length === 0) return [];

      const { data: coursesData } = await supabase
        .from("courses")
        .select("*")
        .in("id", courseIds);

      return (coursesData || []).map((course) => {
        const enrollment = enrollments?.find((e) => e.course_id === course.id);
        return {
          ...course,
          is_enrolled: true,
          progress_percentage: enrollment?.progress_percentage || 0,
        } as Course;
      });
    },
    enabled: !!user,
  });

  const enrollInCourse = useMutation({
    mutationFn: async (courseId: string) => {
      if (!user) throw new Error("Must be logged in");

      const { error } = await supabase.from("course_enrollments").insert({
        user_id: user.id,
        course_id: courseId,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      queryClient.invalidateQueries({ queryKey: ["enrolled-courses"] });
      toast({ title: "Enrolled successfully!" });
    },
    onError: (error) => {
      toast({ title: "Error enrolling", description: error.message, variant: "destructive" });
    },
  });

  return {
    courses,
    enrolledCourses,
    isLoading,
    enrollInCourse,
  };
}

export function useCourseLessons(courseId: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: lessons, isLoading } = useQuery({
    queryKey: ["course-lessons", courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("course_lessons")
        .select("*")
        .eq("course_id", courseId)
        .order("order_index", { ascending: true });

      if (error) throw error;

      // Get progress for each lesson
      const lessonsWithProgress = await Promise.all(
        (data || []).map(async (lesson) => {
          let isCompleted = false;

          if (user) {
            const { data: progress } = await supabase
              .from("lesson_progress")
              .select("is_completed")
              .eq("lesson_id", lesson.id)
              .eq("user_id", user.id)
              .maybeSingle();

            isCompleted = progress?.is_completed || false;
          }

          return { ...lesson, is_completed: isCompleted } as Lesson;
        })
      );

      return lessonsWithProgress;
    },
  });

  const { data: course } = useQuery({
    queryKey: ["course", courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("id", courseId)
        .single();

      if (error) throw error;
      return data as Course;
    },
  });

  const completeLesson = useMutation({
    mutationFn: async (lessonId: string) => {
      if (!user) throw new Error("Must be logged in");

      const { data: existing } = await supabase
        .from("lesson_progress")
        .select("id")
        .eq("lesson_id", lessonId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("lesson_progress")
          .update({ is_completed: true, completed_at: new Date().toISOString() })
          .eq("id", existing.id);
      } else {
        await supabase.from("lesson_progress").insert({
          user_id: user.id,
          lesson_id: lessonId,
          is_completed: true,
          completed_at: new Date().toISOString(),
        });
      }

      // Update course progress
      const totalLessons = lessons?.length || 0;
      const completedLessons = (lessons?.filter((l) => l.is_completed).length || 0) + 1;
      const progressPercentage = Math.round((completedLessons / totalLessons) * 100);

      await supabase
        .from("course_enrollments")
        .update({
          progress_percentage: progressPercentage,
          completed_at: progressPercentage === 100 ? new Date().toISOString() : null,
        })
        .eq("course_id", courseId)
        .eq("user_id", user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course-lessons", courseId] });
      queryClient.invalidateQueries({ queryKey: ["enrolled-courses"] });
      toast({ title: "Lesson completed!" });
    },
  });

  return {
    course,
    lessons,
    isLoading,
    completeLesson,
  };
}
