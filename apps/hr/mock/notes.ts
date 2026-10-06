import { INote } from "@/types/notes";
import { PaginatedData } from "@/types";

export const MOCK_NOTES: INote[] = [
  {
    id: 1,
    content: "This is a great employee, always on time and very productive.",
    createdByUser: {
      id: 1,
      firstName: "Ahmed",
      lastName: "Mahmoud",
      username: "ahmedmahmoud252",
      email: "alrba2003@gmail.com",
      avatar: ""
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const MOCK_PAGINATED_NOTES: PaginatedData<INote> = {
  items: MOCK_NOTES,
  meta: {
    total: 2,
    page: 1,
    limit: 10,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  },
};
