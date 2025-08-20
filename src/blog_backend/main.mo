import Debug "mo:base/Debug";

import Array "mo:base/Array";
import Text "mo:base/Text";
import Time "mo:base/Time";
import Principal "mo:base/Principal";
import Iter "mo:base/Iter";

actor Blog {

  // Types must be declared first
  type Author = {
    name: Text;
    avatar: Text;
  };

  type PostStatus = { #Draft; #Published; #Archived };

  type Post = {
    id: Nat;
    title: Text;
    content: Text;
    category: Text;
    date: Nat;
    author: Author;
    image: Text;
    isFeatured: Bool;
    isEditorsPick: Bool;
    views: Nat;
    status: PostStatus;
  };

  // Stable state
  stable var posts: [Post] = [];
  stable var nextPostId: Nat = 1;

  // Find post index by id
  func findPostIndexById(id: Nat) : ?Nat {
    var i: Nat = 0;
    while (i < Array.size(posts)) {
      if (posts[i].id == id) return ?i;
      i += 1;
    };
    return null;
  };

  // Get all posts
  public query func getPosts() : async [Post] {
    posts
  };

  // Get single post by id
  public query func getPostById(id: Nat) : async ?Post {
    switch (findPostIndexById(id)) {
      case (?idx) { ?posts[idx] };
      case null { null };
    }
  };

  // Create new post
  public shared func createPost(
    title: Text,
    content: Text,
    category: Text,
    date: Nat,
    author: Author,
    image: Text,
    isFeatured: Bool,
    isEditorsPick: Bool,
    status: PostStatus
  ) : async Post {
    let newPost = {
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
    };
    posts := Array.append<Post>(posts, [newPost]);
    nextPostId += 1;
    newPost
  };

  // Update existing post
  public shared func updatePost(
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
    switch (findPostIndexById(id)) {
      case (?idx) {
        let updatedPost = {
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
        };
        var newPosts: [Post] = [];
        var i: Nat = 0;
        while (i < Array.size(posts)) {
          newPosts := if (i == idx) Array.append(newPosts, [updatedPost])
                      else Array.append(newPosts, [posts[i]]);
          i += 1;
        };
        posts := newPosts;
        ?updatedPost
      };
      case null { null };
    }
  };
  public shared func deletePost(id: Nat) : async Bool {
    switch (findPostIndexById(id)) {
      case (?idx) {
        var newPosts: [Post] = [];
        var i: Nat = 0;
        while (i < Array.size(posts)) {
          if (i != idx) {
            newPosts := Array.append(newPosts, [posts[i]]);
          };
          i += 1;
        };
        posts := newPosts;
        true
      };
      case null { false };
    }

  };

};
