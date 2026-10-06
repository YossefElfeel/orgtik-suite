export enum CommentReactionEnum {
  LIKE = "like",
  LOVE = "love",
  LAUGH = "laugh",
  WOW = "wow",
  SAD = "sad",
  ANGRY = "angry",
  THUMBS_DOWN = "thumbs_down",
}

export const REACTION_EMOJIES_SYMPOLS: Record<CommentReactionEnum, string> = {
  [CommentReactionEnum.LIKE]: "👍",
  [CommentReactionEnum.LOVE]: "❤️",
  [CommentReactionEnum.LAUGH]: "😂",
  [CommentReactionEnum.WOW]: "😮",
  [CommentReactionEnum.SAD]: "😢",
  [CommentReactionEnum.ANGRY]: "😠",
  [CommentReactionEnum.THUMBS_DOWN]: "👎",
};