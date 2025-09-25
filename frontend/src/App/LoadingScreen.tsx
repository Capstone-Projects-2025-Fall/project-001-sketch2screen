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
                <div className="loading-spinner" style={{ borderTopColor: color }} />
                <div className="loading-text" style={{ fontSize: "2.5em",fontFamily:"Arial Black" }}>Generating...</div>
            </>
        )
    
}