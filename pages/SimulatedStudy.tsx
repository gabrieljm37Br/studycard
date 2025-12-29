import Study from './Study';

// Página dedicada para estudo de simulados.
// Reutiliza o componente Study com o modo simulado habilitado,
// o que desativa SRS/XP/streak e grava as estatísticas em tabelas exclusivas.
const SimulatedStudy: React.FC = () => {
    return <Study simulationMode />;
};

export default SimulatedStudy;
