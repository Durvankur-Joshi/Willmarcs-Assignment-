import * as React from 'react'
import { Check, Copy, Mail, ShieldCheck } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { OutreachEmailData } from '@/types/analysis'

interface OutreachEmailProps {
  email: OutreachEmailData
}

export function OutreachEmail({ email }: OutreachEmailProps) {
  const [copied, setCopied] = React.useState(false)
  const [copyError, setCopyError] = React.useState<string | null>(null)

  const wordCount = React.useMemo(() => {
    if (!email.body) return 0
    return email.body
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length
  }, [email.body])

  const isUnderLimit = wordCount < 120

  async function handleCopy() {
    setCopyError(null)
    const fullText = `Subject: ${email.subject}\n\n${email.body}`
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(fullText)
        setCopied(true)
        setTimeout(() => setCopied(false), 2500)
      } else {
        const textarea = document.createElement('textarea')
        textarea.value = fullText
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
        setCopied(true)
        setTimeout(() => setCopied(false), 2500)
      }
    } catch {
      setCopyError('Failed to copy to clipboard. Please copy manually.')
    }
  }

  return (
    <Card className="border-slate-200 bg-white shadow-xs">
      <CardHeader className="pb-3 border-b border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Mail className="h-4 w-4 text-blue-600" />
              Personalized Outreach Email
            </CardTitle>
            <p className="text-xs text-slate-500">
              Evidence-based cold outreach draft tailored for marketing decision makers.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant="outline"
              className={
                isUnderLimit
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-medium'
                  : 'bg-amber-50 text-amber-700 border-amber-200 text-xs font-medium'
              }
            >
              <ShieldCheck className="h-3 w-3 mr-1" />
              {wordCount} words {isUnderLimit ? '(Under 120 words target)' : '(Exceeds 120 words)'}
            </Badge>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="text-xs h-8 border-slate-200 hover:bg-slate-50 text-slate-700"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 mr-1 text-slate-500" />
                  Copy Email
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        {copyError && (
          <p className="text-xs text-red-600 font-medium" role="alert">
            {copyError}
          </p>
        )}

        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-xs">
            <span className="font-semibold text-slate-500 w-16 shrink-0">Subject:</span>
            <span className="font-medium text-slate-900 select-all">{email.subject}</span>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500">Body:</label>
            <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-lg text-xs leading-relaxed text-slate-800 whitespace-pre-line font-sans select-all">
              {email.body}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
