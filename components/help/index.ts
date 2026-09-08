import React from 'react';
import { HelpSectionProps } from './types';
import { HelpIntroSection } from './HelpIntroSection';
import { HelpStructuredTextSection } from './HelpStructuredTextSection';
import { HelpCreationSection } from './HelpCreationSection';
import { HelpCsvSection } from './HelpCsvSection';
import { HelpAnkiSection } from './HelpAnkiSection';
import { HelpOrganizationSection } from './HelpOrganizationSection';
import { HelpStudySection } from './HelpStudySection';
import { HelpSimulatedSection } from './HelpSimulatedSection';
import { HelpSrsSection } from './HelpSrsSection';
import { HelpCalendarSection } from './HelpCalendarSection';
import { HelpStatisticsSection } from './HelpStatisticsSection';
import { HelpGamificationSection } from './HelpGamificationSection';
import { HelpPermissionsSection } from './HelpPermissionsSection';
import { HelpTipsSection } from './HelpTipsSection';

export * from './types';
export { HelpIntroSection } from './HelpIntroSection';
export { HelpStructuredTextSection } from './HelpStructuredTextSection';
export { HelpCreationSection } from './HelpCreationSection';
export { HelpCsvSection } from './HelpCsvSection';
export { HelpAnkiSection } from './HelpAnkiSection';
export { HelpOrganizationSection } from './HelpOrganizationSection';
export { HelpStudySection } from './HelpStudySection';
export { HelpSimulatedSection } from './HelpSimulatedSection';
export { HelpSrsSection } from './HelpSrsSection';
export { HelpCalendarSection } from './HelpCalendarSection';
export { HelpStatisticsSection } from './HelpStatisticsSection';
export { HelpGamificationSection } from './HelpGamificationSection';
export { HelpPermissionsSection } from './HelpPermissionsSection';
export { HelpTipsSection } from './HelpTipsSection';

export const HELP_SECTION_COMPONENTS: Record<string, React.FC<HelpSectionProps>> = {
    'intro': HelpIntroSection,
    'texto-estruturado': HelpStructuredTextSection,
    'criacao': HelpCreationSection,
    'importar-csv': HelpCsvSection,
    'importar-txt-anki': HelpAnkiSection,
    'organizacao': HelpOrganizationSection,
    'estudo': HelpStudySection,
    'simulado': HelpSimulatedSection,
    'srs': HelpSrsSection,
    'calendario': HelpCalendarSection,
    'estatisticas': HelpStatisticsSection,
    'gamificacao': HelpGamificationSection,
    'permissoes': HelpPermissionsSection,
    'dicas': HelpTipsSection,
};

