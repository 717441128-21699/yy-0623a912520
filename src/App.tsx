import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { CardOverview } from "@/pages/CardOverview";
import { RevenueRecognition } from "@/pages/RevenueRecognition";
import { RedemptionFlow } from "@/pages/RedemptionFlow";
import { RiskCards } from "@/pages/RiskCards";
import { StoreReconciliation } from "@/pages/StoreReconciliation";
import { ReportsExport } from "@/pages/ReportsExport";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/overview" replace />} />
          <Route path="/overview" element={<CardOverview />} />
          <Route path="/revenue" element={<RevenueRecognition />} />
          <Route path="/redemption" element={<RedemptionFlow />} />
          <Route path="/risk" element={<RiskCards />} />
          <Route path="/reconciliation" element={<StoreReconciliation />} />
          <Route path="/reports" element={<ReportsExport />} />
          <Route path="*" element={<Navigate to="/overview" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}
