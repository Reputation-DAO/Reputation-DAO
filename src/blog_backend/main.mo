import Debug "mo:base/Debug";
import Text "mo:base/Text";
import Time "mo:base/Time";
import Array "mo:base/Array";
import Nat "mo:base/Nat";
import List "mo:base/List";
import Iter "mo:base/Iter";

actor BlogBackend {

  var postIdCounter : Nat = 0;

  type Post = {
    id : Nat;
    title : Text;
    content : Text;
    author : Text;
    timestamp : Time.Time;
  };

  stable var posts : [(Nat, Post)] = [];

  public func createPost(title: Text, content: Text, author: Text) : async Nat {
    let id = postIdCounter;
    let timestamp = Time.now();
    let newPost : Post = {
      id = id;
      title = title;
      content = content;
      author = author;
      timestamp = timestamp;
    };
    posts := Array.append(posts, [(id, newPost)]);
    postIdCounter += 1;
    return id;
  };

  public query func getPost(id: Nat) : async ?Post {
    var foundPost : ?Post = null;
    for (i in Iter.range(0, posts.size() - 1)) {
      let (pid, post) = posts[i];
      if (pid == id) {
        foundPost := ?post;
      };
    };
    return foundPost;
  };

  public query func listPosts() : async [Post] {
    Array.map<(Nat, Post), Post>(posts, func((_, post)) { post });
  };

  public func deletePost(id: Nat) : async Bool {
    let mutableList = Array.toList(posts);
    let filteredList = List.filter<(Nat, Post)>(mutableList, func((pid, _)) {
      pid != id
    });
    let found = List.size(mutableList) != List.size(filteredList);
    posts := List.toArray(filteredList);
    return found;
  };

  public func updatePost(id: Nat, newTitle: Text, newContent: Text) : async Bool {
    var updated : Bool = false;
    posts := Array.map<(Nat, Post), (Nat, Post)>(
      posts,
      func((pid, post)) {
        if (pid == id) {
          updated := true;
          (
            pid,
            {
              id = post.id;
              title = newTitle;
              content = newContent;
              author = post.author;
              timestamp = post.timestamp;
            }
          )
        } else {
          (pid, post)
        }
      }
    );
    return updated;
  };

};
