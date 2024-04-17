export function makeTags(customTags: string[], summary: boolean = false) {
  const tags: any = {};

  if (!summary && customTags.includes('Hint')) {
    tags.hint = {
      render: 'Hint',
      attributes: {
        style: {
          type: String
        }
      }
    };
  }

  return tags;
}
