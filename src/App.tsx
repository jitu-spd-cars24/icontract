import { StoreProvider, useStore } from "@/store";
import { ToastHost } from "@/components/shared";
import { Chooser } from "@/screens/Chooser";
import { NextGenWorkspace } from "@/screens/NextGenWorkspace";
import { Dashboard } from "@/screens/Dashboard";
import { StartingPoint } from "@/screens/StartingPoint";
import { MerlinIntake } from "@/screens/MerlinIntake";
import { ImportPaper } from "@/screens/ImportPaper";
import { DuplicateContract } from "@/screens/DuplicateContract";
import { MetadataReview } from "@/screens/MetadataReview";
import { TemplateSelection } from "@/screens/TemplateSelection";
import { GenerateDraft } from "@/screens/GenerateDraft";
import { Workspace } from "@/screens/workspace/Workspace";

function TraditionalRouter() {
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
      return <Workspace />; // classic document editor
    default:
      return <Dashboard />;
  }
}

function Root() {
  const { appMode } = useStore();
  if (appMode === "chooser") return <Chooser />;
  if (appMode === "nextgen") return <NextGenWorkspace />;
  return <TraditionalRouter />;
}

export default function App() {
  return (
    <StoreProvider>
      <Root />
      <ToastHost />
    </StoreProvider>
  );
}
