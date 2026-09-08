import { SpacesEditor } from '../components/SpacesEditor';

export default function SpaceEditorPage({ params }: { params: { spaceId: string } }) {
  return <SpacesEditor spaceId={params.spaceId} />;
}
