export interface INote {
  id: number;
  content: string;
  createdByUser: {
    id: number;
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    avatar: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ICreateNoteDTO {
  content: string;
}

export interface IUpdateNoteDTO {
  content: string;
}
