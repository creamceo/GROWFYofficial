import React from "react";
import { Routes, Route } from "react-router-dom";
import { LoginPage } from "./components/auth/LoginPage";
import { MainLayout } from "./components/layout/MainLayout";
import { CourseGrid } from "./components/course/CourseGrid";
import { MaterialEmptyPage } from "./components/material/MaterialEmptyPage";
import { EventsGanttPage } from "./components/events/EventsGanttPage";
import { LessonDemoPage } from "./components/course/LessonDemoPage";
import { LessonFinalPage } from "./components/course/LessonFinalPage";
import { CourseViewPage } from "./components/course/CourseViewPage";
import { CourseCreationPage } from "./components/course/CourseCreationPage";
import { StaffPage } from "./components/staff/StaffPage";

export const AppRouter: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />

      <Route element={<MainLayout />}>
        <Route path="/courses" element={<CourseGrid />} />
        <Route path="/courses/create" element={<CourseCreationPage />} />
        <Route path="/course/view/:id" element={<CourseViewPage />} />

        <Route path="/material" element={<MaterialEmptyPage />} />
        <Route path="/events" element={<EventsGanttPage />} />
        <Route path="/staff" element={<StaffPage />} />

        <Route path="/lesson/demo" element={<LessonDemoPage />} />
        <Route path="/lesson/final" element={<LessonFinalPage />} />
      </Route>
    </Routes>
  );
};
