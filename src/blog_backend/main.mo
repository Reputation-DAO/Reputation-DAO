import Array "mo:base/Array";
import Buffer "mo:base/Buffer";
import Char "mo:base/Char";
import Debug "mo:base/Debug";
import Int "mo:base/Int";
import Nat "mo:base/Nat";
import Nat8 "mo:base/Nat8";
import Text "mo:base/Text";
import Time "mo:base/Time";

persistent actor Blog {

  // ---------------- Types ----------------

  // Off-chain storage pointer (Supabase)
  public type SupabaseRef = {
    bucket : Text;      // e.g. "blog-assets"
    path   : Text;      // e.g. "posts/123/hero.png"
    mime   : ?Text;     // optional hint
    size   : ?Nat;      // optional bytes
  };

  // Presentation metadata + pointer
  public type MediaAsset = {
    ref         : SupabaseRef;   // canonical locator
    alt         : Text;
    caption     : ?Text;
    credit      : ?Text;
    aspectRatio : ?Text;         // e.g. "16:9"
  };

  public type Tone = {
    #info    : ();
    #success : ();
    #warning : ();
    #danger  : ();
    #tip     : ();
  };

  public type SocialLink = { text : Text; url : Text };

  public type Author = {
    name  : Text;
    avatar: Text;     // could also be a MediaAsset if you want later
    title : ?Text;
    bio   : ?Text;
    links : [SocialLink];
  };

  public type HeroSettings = {
    media           : MediaAsset;
    overlayTitle    : ?Text;
    overlaySubtitle : ?Text;
    ctaLabel        : ?Text;
    ctaUrl          : ?Text;
    accentColor     : ?Text;
  };

  public type ContentBlock = {
    #Paragraph : { text : Text };
    #Heading   : { level : Nat8; text : Text; anchor : ?Text };
    #Quote     : { text : Text; attribution : ?Text };
    #List      : { ordered : Bool; items : [Text] };
    #Image     : { asset : MediaAsset; fullWidth : Bool };   // uses MediaAsset (SupabaseRef inside)
    #Code      : { language : Text; code : Text };
    #Embed     : { provider : ?Text; url : Text; title : ?Text };
    #Callout   : { tone : Tone; title : Text; body : Text };
    #Divider;
  };

  public type SeoMeta = {
    title        : ?Text;
    description  : ?Text;
    keywords     : [Text];
    canonicalUrl : ?Text;
    ogImage      : ?MediaAsset;   // points to Supabase via MediaAsset.ref
    twitterCard  : ?Text;
  };

  public type PostStatus = { #Draft; #Scheduled; #Published; #Archived };

  public type FeatureFlags = {
    featured      : Bool;
    editorsPick   : Bool;
    allowComments : Bool;
    heroLayout    : Text;
  };

  public type Metrics = { views : Nat; likes : Nat; shares : Nat };

  public type Post = {
    id            : Nat;
    slug          : Text;
    title         : Text;
    subtitle      : ?Text;
    excerpt       : Text;
    category      : Text;
    tags          : [Text];
    author        : Author;
    hero          : ?HeroSettings;
    gallery       : [MediaAsset];     // only refs, no bytes
    content       : [ContentBlock];   // image blocks also use MediaAsset refs
    seo           : SeoMeta;
    readingMinutes: Nat;
    status        : PostStatus;
    flags         : FeatureFlags;
    metrics       : Metrics;
    createdAt     : Nat;
    updatedAt     : Nat;
    publishedAt   : ?Nat;
    scheduledFor  : ?Nat;
    related       : [Nat];
  };

  public type PostSummary = {
    id            : Nat;
    slug          : Text;
    title         : Text;
    subtitle      : ?Text;
    excerpt       : Text;
    category      : Text;
    tags          : [Text];
    author        : Author;
    hero          : ?HeroSettings;
    status        : PostStatus;
    flags         : FeatureFlags;
    readingMinutes: Nat;
    publishedAt   : ?Nat;
    metrics       : Metrics;
    createdAt     : Nat;
    updatedAt     : Nat;
  };

  public type CreatePostPayload = {
    slug         : Text;
    title        : Text;
    subtitle     : ?Text;
    excerpt      : Text;
    category     : Text;
    tags         : [Text];
    author       : Author;
    hero         : ?HeroSettings;
    gallery      : [MediaAsset];     // Supabase-backed assets
    content      : [ContentBlock];   // may contain #Image with MediaAsset
    seo          : ?SeoMeta;
    status       : PostStatus;
    flags        : ?FeatureFlags;
    scheduledFor : ?Nat;
    related      : [Nat];
  };

  public type ReplacePostPayload = CreatePostPayload;

  // ---------------- Stable state ----------------

  stable var posts     : [Post] = [];
  stable var nextPostId: Nat    = 1;

  // ---------------- Helpers ----------------

  func nowSeconds() : Nat {
    let ts = Time.now();
    let ns = Int.abs(ts);
    ns / 1_000_000_000
  };

  func defaultFlags() : FeatureFlags {
    { featured = false; editorsPick = false; allowComments = true; heroLayout = "classic" }
  };

  func defaultSeo() : SeoMeta {
    {
      title = null; description = null; keywords = [];
      canonicalUrl = null; ogImage = null; twitterCard = ?"summary_large_image";
    }
  };

  func ensureSlugAvailable(slug: Text, ignoreId: ?Nat) {
    for (post in posts.vals()) {
      if (Text.equal(post.slug, slug)) {
        switch (ignoreId) {
          case (?allowed) { if (post.id != allowed) Debug.trap("Slug already in use by another post") };
          case null { Debug.trap("Slug already in use") };
        }
      };
    };
  };

  func findIndexById(id: Nat) : ?Nat {
    var i: Nat = 0;
    let total = posts.size();
    while (i < total) {
      if (posts[i].id == id) return ?i;
      i += 1;
    };
    null
  };

  func findIndexBySlug(slug: Text) : ?Nat {
    var i: Nat = 0;
    let total = posts.size();
    while (i < total) {
      if (Text.equal(posts[i].slug, slug)) return ?i;
      i += 1;
    };
    null
  };

  func uniqueTexts(items: [Text]) : [Text] {
    let buf = Buffer.Buffer<Text>(items.size());
    for (item in items.vals()) {
      var exists = false;
      for (current in buf.vals()) {
        if (Text.equal(current, item)) { exists := true };
      };
      if (not exists) { buf.add(item) };
    };
    Buffer.toArray(buf)
  };

  func uniqueNats(items: [Nat]) : [Nat] {
    let buf = Buffer.Buffer<Nat>(items.size());
    for (item in items.vals()) {
      var exists = false;
      for (current in buf.vals()) {
        if (current == item) { exists := true };
      };
      if (not exists) { buf.add(item) };
    };
    Buffer.toArray(buf)
  };

  func countWords(text: Text) : Nat {
    var count : Nat = 0;
    var inWord = false;
    for (ch in Text.toIter(text)) {
      if (Char.isWhitespace(ch)) {
        if (inWord) { count += 1; inWord := false };
      } else { inWord := true };
    };
    if (inWord) { count += 1 };
    count
  };

  func wordsInBlock(block: ContentBlock) : Nat {
    switch (block) {
      case (#Paragraph payload) { countWords(payload.text) };
      case (#Heading payload)   { countWords(payload.text) };
      case (#Quote payload)     {
        countWords(payload.text) +
        (switch (payload.attribution) { case (?a) countWords(a); case null 0 })
      };
      case (#List payload)      {
        var total : Nat = 0;
        for (item in payload.items.vals()) { total += countWords(item) };
        total
      };
      case (#Image _)           0;
      case (#Code payload)      { countWords(payload.code) };
      case (#Embed payload)     { (switch (payload.title) { case (?t) countWords(t); case null 0 }) };
      case (#Callout payload)   { countWords(payload.title) + countWords(payload.body) };
      case (#Divider)           0;
    }
  };

  func computeReadingMinutes(blocks: [ContentBlock]) : Nat {
    var words : Nat = 0;
    for (block in blocks.vals()) { words += wordsInBlock(block) };
    if (words == 0) { return 1 };
    let perMinute = 200;
    let minutes = words / perMinute;
    if (words % perMinute == 0) minutes else minutes + 1
  };

  func mergeFlags(flags: ?FeatureFlags) : FeatureFlags {
    switch (flags) { case (?f) f; case null defaultFlags() }
  };

  func resolveSeo(meta: ?SeoMeta) : SeoMeta {
    switch (meta) {
      case (?m) {
        {
          title        = m.title;
          description  = m.description;
          keywords     = uniqueTexts(m.keywords);
          canonicalUrl = m.canonicalUrl;
          ogImage      = m.ogImage;
          twitterCard  = (switch (m.twitterCard) { case (?card) ?card; case null ?"summary_large_image" });
        }
      };
      case null defaultSeo();
    }
  };

  func postToSummary(post: Post) : PostSummary {
    {
      id = post.id; slug = post.slug; title = post.title; subtitle = post.subtitle;
      excerpt = post.excerpt; category = post.category; tags = post.tags; author = post.author;
      hero = post.hero; status = post.status; flags = post.flags; readingMinutes = post.readingMinutes;
      publishedAt = post.publishedAt; metrics = post.metrics; createdAt = post.createdAt; updatedAt = post.updatedAt;
    }
  };

  func updateAt(index: Nat, post: Post) {
    let total = posts.size();
    let snapshot = posts;
    posts := Array.tabulate<Post>(
      total,
      func(i: Nat) : Post { if (i == index) post else snapshot[i] },
    );
  };

  // ---------------- Extra media helpers (for cascade deletes on Supabase)

  // Return all media refs for a post (hero + gallery + images inside content)
  public query func getAllMediaRefsForPost(id: Nat) : async ?[SupabaseRef] {
    switch (findIndexById(id)) {
      case null { null };
      case (?idx) {
        let p = posts[idx];
        let heroRefs : [SupabaseRef] = switch (p.hero) { case (?h) [h.media.ref]; case null [] };

        // scan content blocks for #Image
        var contentRefs : [SupabaseRef] = [];
        for (b in p.content.vals()) {
          switch (b) {
            case (#Image payload) { contentRefs := Array.append(contentRefs, [payload.asset.ref]) };
            case _ {};
          }
        };

        let galleryRefs = Array.tabulate<SupabaseRef>(p.gallery.size(), func(i) { p.gallery[i].ref });
        ?Array.append(Array.append(heroRefs, galleryRefs), contentRefs)
      }
    }
  };

  // ---------------- Mutations ----------------

  public shared func createPost(payload: CreatePostPayload) : async Post {
    ensureSlugAvailable(payload.slug, null);

    let created        = nowSeconds();
    let seo            = resolveSeo(payload.seo);
    let flags          = mergeFlags(payload.flags);
    let readingMinutes = computeReadingMinutes(payload.content);
    let scheduled      = switch (payload.status) {
      case (#Scheduled) payload.scheduledFor;
      case _            payload.scheduledFor;
    };
    let publishedAt    = switch (payload.status) {
      case (#Published) switch (payload.scheduledFor) { case (?ts) ?ts; case null ?created };
      case _            null;
    };

    let post : Post = {
      id            = nextPostId;
      slug          = payload.slug;
      title         = payload.title;
      subtitle      = payload.subtitle;
      excerpt       = payload.excerpt;
      category      = payload.category;
      tags          = uniqueTexts(payload.tags);
      author        = payload.author;
      hero          = payload.hero;       // MediaAsset with SupabaseRef
      gallery       = payload.gallery;    // same
      content       = payload.content;    // may include #Image blocks with MediaAsset
      seo           = seo;
      readingMinutes= readingMinutes;
      status        = payload.status;
      flags         = flags;
      metrics       = { views = 0; likes = 0; shares = 0 };
      createdAt     = created;
      updatedAt     = created;
      publishedAt   = publishedAt;
      scheduledFor  = scheduled;
      related       = uniqueNats(payload.related);
    };

    posts := Array.append<Post>(posts, [post]);
    nextPostId += 1;
    post
  };

  public shared func replacePost(id: Nat, payload: ReplacePostPayload) : async ?Post {
    switch (findIndexById(id)) {
      case null { null };
      case (?index) {
        ensureSlugAvailable(payload.slug, ?id);
        let existing       = posts[index];
        let seo            = resolveSeo(payload.seo);
        let flags          = mergeFlags(payload.flags);
        let readingMinutes = computeReadingMinutes(payload.content);
        let nowTs          = nowSeconds();
        let scheduled      = switch (payload.status) {
          case (#Scheduled) payload.scheduledFor;
          case _            payload.scheduledFor;
        };
        let publishedAt    = switch (payload.status) {
          case (#Published) {
            switch (payload.scheduledFor) {
              case (?ts) ?ts;
              case null  switch (existing.publishedAt) { case (?prev) ?prev; case null ?nowTs };
            }
          };
          case (#Archived) existing.publishedAt;
          case _           null;
        };

        let post : Post = {
          id            = existing.id;
          slug          = payload.slug;
          title         = payload.title;
          subtitle      = payload.subtitle;
          excerpt       = payload.excerpt;
          category      = payload.category;
          tags          = uniqueTexts(payload.tags);
          author        = payload.author;
          hero          = payload.hero;
          gallery       = payload.gallery;
          content       = payload.content;
          seo           = seo;
          readingMinutes= readingMinutes;
          status        = payload.status;
          flags         = flags;
          metrics       = existing.metrics;
          createdAt     = existing.createdAt;
          updatedAt     = nowTs;
          publishedAt   = publishedAt;
          scheduledFor  = scheduled;
          related       = uniqueNats(payload.related);
        };
        updateAt(index, post);
        ?post
      };
    }
  };

  public shared func updateStatus(id: Nat, status: PostStatus, scheduledFor: ?Nat) : async ?Post {
    switch (findIndexById(id)) {
      case null { null };
      case (?index) {
        let existing  = posts[index];
        let nowTs     = nowSeconds();
        let publishedAt = switch (status) {
          case (#Published) switch (scheduledFor) {
            case (?ts) ?ts;
            case null  switch (existing.publishedAt) { case (?prev) ?prev; case null ?nowTs };
          };
          case (#Archived) existing.publishedAt;
          case _           null;
        };
        let updated : Post = {
          id            = existing.id;
          slug          = existing.slug;
          title         = existing.title;
          subtitle      = existing.subtitle;
          excerpt       = existing.excerpt;
          category      = existing.category;
          tags          = existing.tags;
          author        = existing.author;
          hero          = existing.hero;
          gallery       = existing.gallery;
          content       = existing.content;
          seo           = existing.seo;
          readingMinutes= existing.readingMinutes;
          status        = status;
          flags         = existing.flags;
          metrics       = existing.metrics;
          createdAt     = existing.createdAt;
          updatedAt     = nowTs;
          publishedAt   = publishedAt;
          scheduledFor  = scheduledFor;
          related       = existing.related;
        };
        updateAt(index, updated);
        ?updated
      }
    }
  };

  public shared func recordView(id: Nat) : async ?Nat {
    switch (findIndexById(id)) {
      case null { null };
      case (?index) {
        let p = posts[index];
        let metrics = { views = p.metrics.views + 1; likes = p.metrics.likes; shares = p.metrics.shares };
        let updated = {
          id = p.id; slug = p.slug; title = p.title; subtitle = p.subtitle; excerpt = p.excerpt;
          category = p.category; tags = p.tags; author = p.author; hero = p.hero; gallery = p.gallery;
          content = p.content; seo = p.seo; readingMinutes = p.readingMinutes; status = p.status;
          flags = p.flags; metrics = metrics; createdAt = p.createdAt; updatedAt = nowSeconds();
          publishedAt = p.publishedAt; scheduledFor = p.scheduledFor; related = p.related;
        };
        updateAt(index, updated);
        ?metrics.views
      }
    }
  };

  public shared func recordLike(id: Nat, delta: Int) : async ?Metrics {
    switch (findIndexById(id)) {
      case null { null };
      case (?index) {
        let p = posts[index];
        let current = p.metrics.likes;
        let change  = Int.abs(delta);
        let newLikes = if (delta >= 0) { current + change }
                       else if (change >= current) { 0 }
                       else { current - change };
        let metrics = { views = p.metrics.views; likes = newLikes; shares = p.metrics.shares };
        let updated = {
          id = p.id; slug = p.slug; title = p.title; subtitle = p.subtitle; excerpt = p.excerpt;
          category = p.category; tags = p.tags; author = p.author; hero = p.hero; gallery = p.gallery;
          content = p.content; seo = p.seo; readingMinutes = p.readingMinutes; status = p.status;
          flags = p.flags; metrics = metrics; createdAt = p.createdAt; updatedAt = nowSeconds();
          publishedAt = p.publishedAt; scheduledFor = p.scheduledFor; related = p.related;
        };
        updateAt(index, updated);
        ?metrics
      }
    }
  };

  public shared func recordShare(id: Nat) : async ?Metrics {
    switch (findIndexById(id)) {
      case null { null };
      case (?index) {
        let p = posts[index];
        let metrics = { views = p.metrics.views; likes = p.metrics.likes; shares = p.metrics.shares + 1 };
        let updated = {
          id = p.id; slug = p.slug; title = p.title; subtitle = p.subtitle; excerpt = p.excerpt;
          category = p.category; tags = p.tags; author = p.author; hero = p.hero; gallery = p.gallery;
          content = p.content; seo = p.seo; readingMinutes = p.readingMinutes; status = p.status;
          flags = p.flags; metrics = metrics; createdAt = p.createdAt; updatedAt = nowSeconds();
          publishedAt = p.publishedAt; scheduledFor = p.scheduledFor; related = p.related;
        };
        updateAt(index, updated);
        ?metrics
      }
    }
  };

  // ---------------- Queries ----------------

  public query func getPosts() : async [Post] { posts };

  public query func getPostById(id: Nat) : async ?Post {
    switch (findIndexById(id)) { case null { null }; case (?index) ?posts[index] }
  };

  public query func getPostBySlug(slug: Text) : async ?Post {
    switch (findIndexBySlug(slug)) { case null { null }; case (?index) ?posts[index] }
  };

  public query func listLatest(offset: Nat, limit: Nat) : async [PostSummary] {
    if (limit == 0) return [];
    let total = posts.size();
    if (offset >= total) return [];
    let buf = Buffer.Buffer<PostSummary>(limit);
    var skipped : Nat = 0;
    var collected : Nat = 0;
    var i : Nat = total;
    while (i > 0 and collected < limit) {
      i -= 1;
      if (skipped < offset) { skipped += 1 } else {
        buf.add(postToSummary(posts[i])); collected += 1;
      }
    };
    Buffer.toArray(buf)
  };

  public query func listByTag(tag: Text, offset: Nat, limit: Nat) : async [PostSummary] {
    if (limit == 0) return [];
    let buf = Buffer.Buffer<PostSummary>(limit);
    var skipped : Nat = 0;
    var collected : Nat = 0;
    var i : Nat = posts.size();
    while (i > 0 and collected < limit) {
      i -= 1;
      let post = posts[i];
      var matches = false;
      for (t in post.tags.vals()) { if (Text.equal(t, tag)) { matches := true } };
      if (matches) {
        if (skipped < offset) { skipped += 1 } else { buf.add(postToSummary(post)); collected += 1 };
      }
    };
    Buffer.toArray(buf)
  };

  public query func listFeatured(limit: Nat) : async [PostSummary] {
    if (limit == 0) return [];
    let buf = Buffer.Buffer<PostSummary>(limit);
    var i : Nat = posts.size();
    while (i > 0 and buf.size() < limit) {
      i -= 1;
      let post = posts[i];
      if (post.flags.featured or post.flags.editorsPick) { buf.add(postToSummary(post)) };
    };
    Buffer.toArray(buf)
  };

  public query func searchByKeyword(keyword: Text, limit: Nat) : async [PostSummary] {
    if (keyword == "" or limit == 0) return [];
    let buf = Buffer.Buffer<PostSummary>(limit);
    var i : Nat = posts.size();
    while (i > 0 and buf.size() < limit) {
      i -= 1;
      let post = posts[i];
      if (Text.contains(post.title, #text keyword) or Text.contains(post.excerpt, #text keyword)) {
        buf.add(postToSummary(post));
      } else {
        var inTags = false;
        for (tag in post.tags.vals()) { if (Text.contains(tag, #text keyword)) { inTags := true } };
        if (inTags) { buf.add(postToSummary(post)) };
      }
    };
    Buffer.toArray(buf)
  };
}
