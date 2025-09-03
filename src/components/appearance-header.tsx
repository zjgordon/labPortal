import { getAppearance } from '@/lib/config/appearance'

interface AppearanceHeaderProps {
  children: (appearance: { instanceName: string; headerText: string | null }) => React.ReactNode
}

export async function AppearanceHeader({ children }: AppearanceHeaderProps) {
  const appearance = await getAppearance()
  
  return <>{children(appearance)}</>
}
