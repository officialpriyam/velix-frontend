export interface StepEvent {
    stepIndex: number;
    label: string;
    startTime: number;
    endTime?: number;
}

export interface PlanEvent {
    text: string;
}

export interface ReasoningEvent {
    text: string;
    stepIndex: number;
}

export interface FileActionEvent {
    path: string;
    op: 'created' | 'edited' | 'deleted';
    content?: string;
    confirmed?: boolean;
    status: 'writing' | 'confirmed';
}

export interface TodoItem {
    text: string;
    status: 'pending' | 'done';
}

export interface ToolProgressEvent {
    tool: string;
    label: string;
    startTime: number;
    endTime?: number;
    progressPct?: number;
}

export interface QueuedMessageEvent {
    prompt: string;
    timestamp: number;
}
