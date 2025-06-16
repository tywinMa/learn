import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import Dashboard from './pages/Dashboard';
import CourseList from './pages/courses/CourseList';
import CourseForm from './pages/courses/CourseForm';
import UnitForm from './pages/units/UnitForm';
import SubjectStageUnits from './pages/units/SubjectStageUnits';
import ExerciseList from './pages/exercises/ExerciseList';
import ExerciseForm from './pages/exercises/ExerciseForm';
import ExerciseGroupList from './pages/exerciseGroups/ExerciseGroupList';
import ExerciseGroupForm from './pages/exerciseGroups/ExerciseGroupForm';
import KnowledgePointList from './pages/knowledgePoints/KnowledgePointList';
import KnowledgePointForm from './pages/knowledgePoints/KnowledgePointForm';
import StudentList from './pages/students/StudentList';
import StudentProgress from './pages/students/StudentProgress';
import SubjectList from './pages/subjects/SubjectList';
import GradeList from './pages/grades/GradeList';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Register from './pages/Register';
import ProtectedRoute from './components/auth/ProtectedRoute';

function App() {
  return (
    <Routes>
      {/* 公开路由 */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      {/* 受保护的路由 - 仅需要登录，不检查权限 */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          
          {/* 仪表盘 */}
          <Route path="dashboard" element={<Dashboard />} />
          
          {/* 课程管理 */}
          <Route path="courses">
            <Route index element={<CourseList />} />
            <Route path="new" element={<CourseForm />} />
            <Route path=":id/edit" element={<CourseForm />} />
          </Route>
          
          {/* 单元管理 */}
          <Route path="units">
            <Route index element={<SubjectStageUnits />} />
            <Route path="new" element={<UnitForm />} />
            <Route path=":id/edit" element={<UnitForm />} />
            <Route path=":id" element={<UnitForm />} />
          </Route>
          
          {/* 练习题管理 */}
          <Route path="exercises">
            <Route index element={<ExerciseList />} />
            <Route path="new" element={<ExerciseForm />} />
            <Route path=":id/edit" element={<ExerciseForm />} />
          </Route>
          
          {/* 习题组管理 */}
          <Route path="exercise-groups">
            <Route index element={<ExerciseGroupList />} />
            <Route path="new" element={<ExerciseGroupForm />} />
            <Route path=":id/edit" element={<ExerciseGroupForm />} />
          </Route>
          
          {/* 知识点管理 */}
          <Route path="knowledge-points">
            <Route index element={<KnowledgePointList />} />
            <Route path="new" element={<KnowledgePointForm />} />
            <Route path=":id/edit" element={<KnowledgePointForm />} />
          </Route>
          
          {/* 学生管理 */}
          <Route path="students">
            <Route index element={<StudentList />} />
            <Route path=":userId/progress" element={<StudentProgress />} />
          </Route>
          
          {/* 学科管理 */}
          <Route path="subjects" element={<SubjectList />} />
          
          {/* 年级管理 */}
          <Route path="grades" element={<GradeList />} />
          
          {/* 系统设置 */}
          <Route path="settings" element={<Settings />} />
        </Route>
      </Route>
      
      {/* 404页面 */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
