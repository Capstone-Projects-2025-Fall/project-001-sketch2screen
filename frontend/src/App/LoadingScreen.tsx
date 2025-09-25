// React Loading Spinner Component with TypeScript
import "./LoadingSpinner.css"
interface LoadingSpinnerProps {
    size?: 'small' | 'medium' | 'large';
    color?: string;
}

export function LoadingSpinner({
    size = 'medium',
    color = "#3498db"
}: LoadingSpinnerProps) {
    return (
        <>
            <div className="spin-container">
            <div className="loading-spinner" style={{ borderTopColor: color }} />
            <div id="loading-text">Generating...</div>
            </div>
        </>
    )

}