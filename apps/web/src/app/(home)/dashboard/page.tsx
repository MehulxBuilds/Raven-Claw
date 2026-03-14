import { redirect } from "next/navigation";

const DashboardPage = () => {
  return redirect('/dashboard/threads');
}

export default DashboardPage;