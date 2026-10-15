import * as React from 'react'
import { ArrowRight, Globe, Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface WebsiteFormProps {
  onSubmit: (url: string) => void
  isLoading: boolean
  currentUrl?: string
}

export function WebsiteForm({ onSubmit, isLoading, currentUrl = '' }: WebsiteFormProps) {
  const [url, setUrl] = React.useState(currentUrl)
  const [prevUrl, setPrevUrl] = React.useState(currentUrl)
  const [validationError, setValidationError] = React.useState<string | null>(null)

  if (currentUrl !== prevUrl) {
    setPrevUrl(currentUrl)
    setUrl(currentUrl)
  }

  function validateUrl(input: string): boolean {
    const trimmed = input.trim()
    if (!trimmed) {
      setValidationError('Please enter a website URL.')
      return false
    }

    if (!/^https?:\/\//i.test(trimmed)) {
      setValidationError('URL must start with http:// or https:// (e.g. https://example.com)')
      return false
    }

    try {
      const parsed = new URL(trimmed)
      if (!parsed.hostname || !parsed.hostname.includes('.')) {
        setValidationError('Please enter a valid domain name (e.g. https://example.com).')
        return false
      }
    } catch {
      setValidationError('Please enter a valid, well-formed URL.')
      return false
    }

    setValidationError(null)
    return true
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (validateUrl(url)) {
      onSubmit(url.trim())
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setUrl(e.target.value)
    if (validationError) {
      setValidationError(null)
    }
  }

  function setSampleUrl(sample: string) {
    setUrl(sample)
    setValidationError(null)
    onSubmit(sample)
  }

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="w-full space-y-3" noValidate>
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
              <Globe className="h-4 w-4" />
            </div>
            <Input
              id="website-url-input"
              type="url"
              value={url}
              onChange={handleInputChange}
              placeholder="https://example.com"
              disabled={isLoading}
              aria-invalid={!!validationError}
              aria-describedby={validationError ? 'url-error' : undefined}
              className="pl-10 h-11 bg-white text-slate-900 border-slate-200 focus-visible:ring-blue-500 rounded-lg shadow-xs text-sm"
            />
          </div>
          <Button
            type="submit"
            disabled={isLoading || !url.trim()}
            className="h-11 px-5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-xs transition-colors shrink-0"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Analyzing...
              </>
            ) : (
              <>
                Analyze Website
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </>
            )}
          </Button>
        </div>

        {validationError && (
          <p id="url-error" className="text-xs text-red-600 font-medium pl-1" role="alert">
            {validationError}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-500">
          <span className="flex items-center gap-1 font-medium text-slate-600">
            <Sparkles className="h-3 w-3 text-blue-500" />
            Try a sample URL:
          </span>
          {['https://stripe.com', 'https://linear.app', 'https://acme.org'].map((sample) => (
            <button
              key={sample}
              type="button"
              disabled={isLoading}
              onClick={() => setSampleUrl(sample)}
              className="text-slate-600 hover:text-blue-600 hover:underline bg-slate-100 hover:bg-blue-50 px-2 py-0.5 rounded border border-slate-200 transition-colors"
            >
              {sample}
            </button>
          ))}
        </div>
      </form>
    </div>
  )
}
