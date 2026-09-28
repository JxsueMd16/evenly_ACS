import { useEffect } from "react"
import { Navigate, Route, Routes } from "react-router-dom"
import { Toaster } from "@/components/ui/sonner"
import { ProtectedRoute } from "@/components/layout/ProtectedRoute"
import { LoginPage } from "@/pages/auth/LoginPage"
import { RegisterPage } from "@/pages/auth/RegisterPage"
import { HomePage } from "@/pages/HomePage"
import { GroupsListPage } from "@/pages/groups/GroupsListPage"
import { GroupDetailPage } from "@/pages/groups/GroupDetailPage"
import { AddExpenseEntryPage } from "@/pages/groups/AddExpenseEntryPage"
import { AddExpensePage } from "@/pages/groups/AddExpensePage"
import { ActivityPage } from "@/pages/ActivityPage"
import { ProfilePage } from "@/pages/ProfilePage"
import { FriendsPage } from "@/pages/FriendsPage"
import { JoinGroupPage } from "@/pages/groups/JoinGroupPage"
import { QuickBillPage } from "@/pages/groups/QuickBillPage"
import { useSettingsStore } from "@/store/settingsStore"

function App() {
  const theme = useSettingsStore((s) => s.theme)

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark")
  }, [theme])

  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/groups" element={<GroupsListPage />} />
          <Route path="/groups/:groupId" element={<GroupDetailPage />} />
          <Route path="/groups/:groupId/add-expense" element={<AddExpensePage />} />
          <Route path="/add-expense" element={<AddExpenseEntryPage />} />
          <Route path="/quick-bill" element={<QuickBillPage />} />
          <Route path="/activity" element={<ActivityPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/friends" element={<FriendsPage />} />
          <Route path="/join/:code" element={<JoinGroupPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster />
    </>
  )
}

export default App
