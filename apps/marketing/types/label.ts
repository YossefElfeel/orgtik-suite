export interface ILabelDTO {
    name: string;
    /** A hex colour; left out, the API picks one. */
    color?: string;
}

export interface ILabel {
    id: string;
    name: string;
    color?: string;
    createdAt?: string;
}

export interface Label {
    id: string;
    name: string;
}

export interface CreateLabelRequest {
    name: string;
}
