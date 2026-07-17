import { StoreProvider, useStore } from "@/store";
import { ToastHost } from "@/components/shared";
import { Dashboard } from "@/screens/Dashboard";
import { StartingPoint } from "@/screens/StartingPoint";
import { MerlinIntake } from "@/screens/MerlinIntake";
import { ImportPaper } from "@/screens/ImportPaper";
import { DuplicateContract } from "@/screens/DuplicateContract";
import { MetadataReview } from "@/screens/MetadataReview";
import { TemplateSelection } from "@/screens/TemplateSelection";
import { GenerateDraft } from "@/screens/GenerateDraft";
import { ChatWorkspace } from "@/screens/workspace/ChatWorkspace";

function Router() {
  const { step } = useStore();
  switch (step) {
    case "dashboard":
      return <Dashboard />;
    case "starting-point":
      return <StartingPoint />;
    case "intake":
      return <MerlinIntake />;
    case "import":
      return <ImportPaper />;
    case "duplicate":
      return <DuplicateContract />;
    case "metadata":
      return <MetadataReview />;
    case "template":
      return <TemplateSelection />;
    case "generating":
      return <GenerateDraft />;
    case "workspace":
      return <ChatWorkspace />;
    default:
      return <Dashboard />;
  }
}

export default function App() {
  return (
    <StoreProvider>
      <Router />
      <ToastHost />
    </StoreProvider>
  );
}
