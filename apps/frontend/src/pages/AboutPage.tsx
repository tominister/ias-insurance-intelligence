import { Shield } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function AboutPage() {
  return (
    <div className="h-full overflow-y-auto px-4 py-6 md:px-8">
      <div className="mx-auto w-full max-w-3xl">
        <Card>
          <CardHeader>
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Shield className="h-6 w-6" />
            </div>
            <CardTitle>IAS Insurance Intelligence Assistant</CardTitle>
            <CardDescription>
              Enterprise insurance copilot grounded in structured RMIS-style data (demo dataset in this build).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              This build connects to <strong>Origami RMIS</strong> for policies, claims, programs, and premiums,
              and <strong>Azure OpenAI via APIM</strong> for natural-language answers. SharePoint, insurance
              document libraries, and the claims warehouse are not connected yet.
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>Frontend: React, Vite, TypeScript, Tailwind CSS</li>
              <li>Backend: FastAPI with Origami on-demand retrieval</li>
              <li>Answers are grounded in Origami API tables only</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
