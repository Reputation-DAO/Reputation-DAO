export const idlFactory = ({ IDL }) => {
  const SupabaseRef = IDL.Record({
    'mime' : IDL.Opt(IDL.Text),
    'path' : IDL.Text,
    'size' : IDL.Opt(IDL.Nat),
    'bucket' : IDL.Text,
  });
  const MediaAsset = IDL.Record({
    'alt' : IDL.Text,
    'ref' : SupabaseRef,
    'credit' : IDL.Opt(IDL.Text),
    'caption' : IDL.Opt(IDL.Text),
    'aspectRatio' : IDL.Opt(IDL.Text),
  });
  const SeoMeta = IDL.Record({
    'title' : IDL.Opt(IDL.Text),
    'twitterCard' : IDL.Opt(IDL.Text),
    'description' : IDL.Opt(IDL.Text),
    'keywords' : IDL.Vec(IDL.Text),
    'ogImage' : IDL.Opt(MediaAsset),
    'canonicalUrl' : IDL.Opt(IDL.Text),
  });
  const FeatureFlags = IDL.Record({
    'featured' : IDL.Bool,
    'heroLayout' : IDL.Text,
    'editorsPick' : IDL.Bool,
    'allowComments' : IDL.Bool,
  });
  const PostStatus = IDL.Variant({
    'Draft' : IDL.Null,
    'Scheduled' : IDL.Null,
    'Archived' : IDL.Null,
    'Published' : IDL.Null,
  });
  const Tone = IDL.Variant({
    'tip' : IDL.Null,
    'warning' : IDL.Null,
    'danger' : IDL.Null,
    'info' : IDL.Null,
    'success' : IDL.Null,
  });
  const ContentBlock = IDL.Variant({
    'Embed' : IDL.Record({
      'url' : IDL.Text,
      'title' : IDL.Opt(IDL.Text),
      'provider' : IDL.Opt(IDL.Text),
    }),
    'Callout' : IDL.Record({
      'title' : IDL.Text,
      'body' : IDL.Text,
      'tone' : Tone,
    }),
    'Code' : IDL.Record({ 'code' : IDL.Text, 'language' : IDL.Text }),
    'Heading' : IDL.Record({
      'text' : IDL.Text,
      'anchor' : IDL.Opt(IDL.Text),
      'level' : IDL.Nat8,
    }),
    'List' : IDL.Record({ 'ordered' : IDL.Bool, 'items' : IDL.Vec(IDL.Text) }),
    'Divider' : IDL.Null,
    'Image' : IDL.Record({ 'asset' : MediaAsset, 'fullWidth' : IDL.Bool }),
    'Paragraph' : IDL.Record({ 'text' : IDL.Text }),
    'Quote' : IDL.Record({
      'text' : IDL.Text,
      'attribution' : IDL.Opt(IDL.Text),
    }),
  });
  const HeroSettings = IDL.Record({
    'media' : MediaAsset,
    'accentColor' : IDL.Opt(IDL.Text),
    'overlayTitle' : IDL.Opt(IDL.Text),
    'ctaUrl' : IDL.Opt(IDL.Text),
    'ctaLabel' : IDL.Opt(IDL.Text),
    'overlaySubtitle' : IDL.Opt(IDL.Text),
  });
  const SocialLink = IDL.Record({ 'url' : IDL.Text, 'text' : IDL.Text });
  const Author = IDL.Record({
    'bio' : IDL.Opt(IDL.Text),
    'title' : IDL.Opt(IDL.Text),
    'name' : IDL.Text,
    'links' : IDL.Vec(SocialLink),
    'avatar' : IDL.Text,
  });
  const CreatePostPayload = IDL.Record({
    'seo' : IDL.Opt(SeoMeta),
    'flags' : IDL.Opt(FeatureFlags),
    'status' : PostStatus,
    'title' : IDL.Text,
    'content' : IDL.Vec(ContentBlock),
    'hero' : IDL.Opt(HeroSettings),
    'slug' : IDL.Text,
    'tags' : IDL.Vec(IDL.Text),
    'related' : IDL.Vec(IDL.Nat),
    'author' : Author,
    'excerpt' : IDL.Text,
    'scheduledFor' : IDL.Opt(IDL.Nat),
    'category' : IDL.Text,
    'subtitle' : IDL.Opt(IDL.Text),
    'gallery' : IDL.Vec(MediaAsset),
  });
  const Metrics = IDL.Record({
    'shares' : IDL.Nat,
    'views' : IDL.Nat,
    'likes' : IDL.Nat,
  });
  const Post = IDL.Record({
    'id' : IDL.Nat,
    'seo' : SeoMeta,
    'flags' : FeatureFlags,
    'status' : PostStatus,
    'title' : IDL.Text,
    'content' : IDL.Vec(ContentBlock),
    'readingMinutes' : IDL.Nat,
    'metrics' : Metrics,
    'hero' : IDL.Opt(HeroSettings),
    'createdAt' : IDL.Nat,
    'slug' : IDL.Text,
    'tags' : IDL.Vec(IDL.Text),
    'publishedAt' : IDL.Opt(IDL.Nat),
    'related' : IDL.Vec(IDL.Nat),
    'author' : Author,
    'updatedAt' : IDL.Nat,
    'excerpt' : IDL.Text,
    'scheduledFor' : IDL.Opt(IDL.Nat),
    'category' : IDL.Text,
    'subtitle' : IDL.Opt(IDL.Text),
    'gallery' : IDL.Vec(MediaAsset),
  });
  const PostSummary = IDL.Record({
    'id' : IDL.Nat,
    'flags' : FeatureFlags,
    'status' : PostStatus,
    'title' : IDL.Text,
    'readingMinutes' : IDL.Nat,
    'metrics' : Metrics,
    'hero' : IDL.Opt(HeroSettings),
    'createdAt' : IDL.Nat,
    'slug' : IDL.Text,
    'tags' : IDL.Vec(IDL.Text),
    'publishedAt' : IDL.Opt(IDL.Nat),
    'author' : Author,
    'updatedAt' : IDL.Nat,
    'excerpt' : IDL.Text,
    'category' : IDL.Text,
    'subtitle' : IDL.Opt(IDL.Text),
  });
  const ReplacePostPayload = IDL.Record({
    'seo' : IDL.Opt(SeoMeta),
    'flags' : IDL.Opt(FeatureFlags),
    'status' : PostStatus,
    'title' : IDL.Text,
    'content' : IDL.Vec(ContentBlock),
    'hero' : IDL.Opt(HeroSettings),
    'slug' : IDL.Text,
    'tags' : IDL.Vec(IDL.Text),
    'related' : IDL.Vec(IDL.Nat),
    'author' : Author,
    'excerpt' : IDL.Text,
    'scheduledFor' : IDL.Opt(IDL.Nat),
    'category' : IDL.Text,
    'subtitle' : IDL.Opt(IDL.Text),
    'gallery' : IDL.Vec(MediaAsset),
  });
  return IDL.Service({
    'createPost' : IDL.Func([CreatePostPayload], [Post], []),
    'getAllMediaRefsForPost' : IDL.Func(
        [IDL.Nat],
        [IDL.Opt(IDL.Vec(SupabaseRef))],
        ['query'],
      ),
    'getPostById' : IDL.Func([IDL.Nat], [IDL.Opt(Post)], ['query']),
    'getPostBySlug' : IDL.Func([IDL.Text], [IDL.Opt(Post)], ['query']),
    'getPosts' : IDL.Func([], [IDL.Vec(Post)], ['query']),
    'listByTag' : IDL.Func(
        [IDL.Text, IDL.Nat, IDL.Nat],
        [IDL.Vec(PostSummary)],
        ['query'],
      ),
    'listFeatured' : IDL.Func([IDL.Nat], [IDL.Vec(PostSummary)], ['query']),
    'listLatest' : IDL.Func(
        [IDL.Nat, IDL.Nat],
        [IDL.Vec(PostSummary)],
        ['query'],
      ),
    'recordLike' : IDL.Func([IDL.Nat, IDL.Int], [IDL.Opt(Metrics)], []),
    'recordShare' : IDL.Func([IDL.Nat], [IDL.Opt(Metrics)], []),
    'recordView' : IDL.Func([IDL.Nat], [IDL.Opt(IDL.Nat)], []),
    'replacePost' : IDL.Func(
        [IDL.Nat, ReplacePostPayload],
        [IDL.Opt(Post)],
        [],
      ),
    'searchByKeyword' : IDL.Func(
        [IDL.Text, IDL.Nat],
        [IDL.Vec(PostSummary)],
        ['query'],
      ),
    'updateStatus' : IDL.Func(
        [IDL.Nat, PostStatus, IDL.Opt(IDL.Nat)],
        [IDL.Opt(Post)],
        [],
      ),
  });
};
export const init = ({ IDL }) => { return []; };
