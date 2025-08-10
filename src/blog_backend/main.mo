import Debug "mo:base/Debug";
import Array "mo:base/Array";

type Principal = async Principal; // for auth stub (replace with real impl)

type Author = {
  name: Text;
  avatar: Text;
};

type PostStatus = { #Draft; #Published; #Archived };

type Comment = {
  id: Nat;
  author: Author;
  content: Text;
  date: Nat; // Unix timestamp
};

type EditLog = {
  timestamp: Nat;
  editor: Author;
  changes: Text; // description of what changed, or JSON diff string
};

type Post = {
  id: Nat;
  title: Text;
  content: Text; // markdown content
  category: Text;
  date: Nat; // unix timestamp
  author: Author;
  image: Text;
  isFeatured: Bool;
  isEditorsPick: Bool;
  views: Nat;
  status: PostStatus;
  comments: [Comment];
  editHistory: [EditLog];
};

actor Blog {

  stable var posts: [Post] = [];
  stable var nextPostId: Nat = 1;
  stable var nextCommentId: Nat = 1;

  // ==== AUTH (stub: only caller with this principal is admin) ====
  let adminPrincipal = /* insert your principal here or check caller */;
  func callerIsAdmin(): Bool {
    switch (Actor.caller()) {
      case (p) if p == adminPrincipal { true };
      case (_) { false };
    }
  };

  // ========== HELPERS ===========

  // Basic full-text search helper: checks if keyword in title/category/content (case-insensitive)
  func matchesSearch(post: Post, keyword: Text): Bool {
    let lowerKeyword = Text.toLower(keyword);
    let inTitle = Text.toLower(post.title).contains(lowerKeyword);
    let inCategory = Text.toLower(post.category).contains(lowerKeyword);
    let inContent = Text.toLower(post.content).contains(lowerKeyword);
    inTitle || inCategory || inContent
  };

  // ========== QUERY METHODS ===========

  public query func getPosts(
    page: Nat,
    perPage: Nat,
    filterFeatured: Bool ?,
    filterCategory: Text ?,
    filterStatus: PostStatus ?,
    searchKeyword: Text ?
  ): async [Post] {
    var filteredPosts = posts;

    switch(filterFeatured) {
      case (?true) { filteredPosts := Array.filter<Post>(filteredPosts, func(p) { p.isFeatured }); };
      case (?false) { filteredPosts := Array.filter<Post>(filteredPosts, func(p) { !p.isFeatured }); };
      case null {};
    };

    switch(filterCategory) {
      case (?cat) { filteredPosts := Array.filter<Post>(filteredPosts, func(p) { p.category == cat }); };
      case null {};
    };

    switch(filterStatus) {
      case (?st) { filteredPosts := Array.filter<Post>(filteredPosts, func(p) { p.status == st }); };
      case null {};
    };

    switch(searchKeyword) {
      case (?kw) { filteredPosts := Array.filter<Post>(filteredPosts, func(p) { matchesSearch(p, kw) }); };
      case null {};
    };

    // Sort published posts by date desc by default
    filteredPosts := Array.sort<Post>(filteredPosts, func(a, b) { b.date - a.date });

    // Pagination (page 1 indexed)
    let start = (page - 1) * perPage;
    let end = start + perPage;
    return Array.slice<Post>(filteredPosts, start, end);
  };

  public query func getPostById(id: Nat): async ?Post {
    return posts.find(func(p) : Bool { p.id == id });
  };

  // ========== UPDATE MUTATORS (ADMIN ONLY) ===========

  public func createPost(
    title: Text,
    content: Text,
    category: Text,
    date: Nat,
    author: Author,
    image: Text,
    isFeatured: Bool,
    isEditorsPick: Bool,
    status: PostStatus
  ) : async ?Post {
    if (!callerIsAdmin()) {
      return null;
    };
    let newPost : Post = {
      id = nextPostId;
      title = title;
      content = content;
      category = category;
      date = date;
      author = author;
      image = image;
      isFeatured = isFeatured;
      isEditorsPick = isEditorsPick;
      views = 0;
      status = status;
      comments = [];
      editHistory = [];
    };
    posts := Array.append<Post>(posts, [newPost]);
    nextPostId += 1;
    return ?newPost;
  };

  public func updatePost(
    id: Nat,
    title: Text,
    content: Text,
    category: Text,
    date: Nat,
    author: Author,
    image: Text,
    isFeatured: Bool,
    isEditorsPick: Bool,
    views: Nat,
    status: PostStatus
  ) : async ?Post {
    if (!callerIsAdmin()) {
      return null;
    };
    let idxOpt = posts.findIndex(func(p) : Bool { p.id == id });
    switch (idxOpt) {
      case (null) { return null; };
      case (?idx) {
        let oldPost = posts[idx];
        let updatedPost : Post = {
          id = id;
          title = title;
          content = content;
          category = category;
          date = date;
          author = author;
          image = image;
          isFeatured = isFeatured;
          isEditorsPick = isEditorsPick;
          views = views;
          status = status;
          comments = oldPost.comments;
          editHistory = Array.append<EditLog>(oldPost.editHistory, [{
            timestamp = Time.now();
            editor = author;
            changes = "Post updated";
          }]);
        };
        posts[idx] := updatedPost;
        return ?updatedPost;
      };
    };
  };

  public func deletePost(id: Nat) : async Bool {
    if (!callerIsAdmin()) {
      return false;
    };
    let originalLen = Array.size(posts);
    posts := Array.filter<Post>(posts, func(p) : Bool { p.id != id });
    return Array.size(posts) < originalLen;
  };

  public func incrementViews(id: Nat) : async ?Nat {
    let idxOpt = posts.findIndex(func(p) : Bool { p.id == id });
    switch (idxOpt) {
      case (null) { return null; };
      case (?idx) {
        var post = posts[idx];
        post.views += 1;
        posts[idx] := post;
        return ?post.views;
      };
    };
  };

  // ========== COMMENTS ===========

  public func addComment(
    postId: Nat,
    author: Author,
    content: Text,
    date: Nat
  ) : async ?Comment {
    if (!callerIsAdmin()) {
      // optionally allow public commenting, remove this check
      return null;
    };
    let idxOpt = posts.findIndex(func(p) : Bool { p.id == postId });
    switch (idxOpt) {
      case (null) { return null; };
      case (?idx) {
        let newComment: Comment = {
          id = nextCommentId;
          author = author;
          content = content;
          date = date;
        };
        nextCommentId += 1;
        var post = posts[idx];
        post.comments := Array.append<Comment>(post.comments, [newComment]);
        posts[idx] := post;
        return ?newComment;
      };
    };
  };

  public func deleteComment(postId: Nat, commentId: Nat) : async Bool {
    if (!callerIsAdmin()) {
      return false;
    };
    let idxOpt = posts.findIndex(func(p) : Bool { p.id == postId });
    switch (idxOpt) {
      case (null) { return false; };
      case (?idx) {
        var post = posts[idx];
        let originalLen = Array.size(post.comments);
        post.comments := Array.filter<Comment>(post.comments, func(c) { c.id != commentId });
        posts[idx] := post;
        return Array.size(post.comments) < originalLen;
      };
    };
  };
};
