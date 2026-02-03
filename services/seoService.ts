
export const updateInterventionSEO = (location: string, type: string, description: string, imageUrl?: string) => {
  const title = `التدخلات الإبداعية | ${location} - ${type}`;
  document.title = title;

  // Update Description
  let metaDesc = document.querySelector('meta[name="description"]');
  if (!metaDesc) {
    metaDesc = document.createElement('meta');
    metaDesc.setAttribute('name', 'description');
    document.head.appendChild(metaDesc);
  }
  metaDesc.setAttribute('content', description);

  // Open Graph Tags for Social Media
  const ogTags = {
    'og:title': title,
    'og:description': description,
    'og:image': imageUrl || '',
    'og:type': 'website'
  };

  Object.entries(ogTags).forEach(([property, content]) => {
    let tag = document.querySelector(`meta[property="${property}"]`);
    if (!tag) {
      tag = document.createElement('meta');
      tag.setAttribute('property', property);
      document.head.appendChild(tag);
    }
    tag.setAttribute('content', content);
  });
};
