import type { ResumeLayoutId } from '../types'
import { AtelierResumeLayout } from './AtelierLayout'
import { ExecutiveResumeLayout } from './ExecutiveLayout'
import { FolioResumeLayout } from './FolioLayout'
import { LedgerResumeLayout } from './LedgerLayout'
import { MagazineResumeLayout } from './MagazineLayout'
import { SidebarResumeLayout } from './SidebarLayout'
import { StandardResumeLayout } from './StandardLayout'
import { TimelineResumeLayout } from './TimelineLayout'
import type { ResumeContentProps } from './resumeContent'

export function ResumeLayoutRenderer({
  layout,
  ...props
}: ResumeContentProps & { layout: ResumeLayoutId }) {
  switch (layout) {
    case 'sidebar':
      return <SidebarResumeLayout {...props} />
    case 'timeline':
      return <TimelineResumeLayout {...props} />
    case 'magazine':
      return <MagazineResumeLayout {...props} />
    case 'executive':
      return <ExecutiveResumeLayout {...props} />
    case 'folio':
      return <FolioResumeLayout {...props} />
    case 'ledger':
      return <LedgerResumeLayout {...props} />
    case 'atelier':
      return <AtelierResumeLayout {...props} />
    default:
      return <StandardResumeLayout {...props} />
  }
}
