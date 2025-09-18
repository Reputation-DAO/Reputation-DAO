export const idlFactory = ({ IDL }) => {
  const Author = IDL.Record({ 'name' : IDL.Text, 'avatar' : IDL.Text });
  const PostStatus = IDL.Variant({
    'Draft' : IDL.Null,
    'Archived' : IDL.Null,
    'Published' : IDL.Null,
  });
  const Post = IDL.Record({
    'id' : IDL.Nat,
    'status' : PostStatus,
    'title' : IDL.Text,
    'content' : IDL.Text,
    'views' : IDL.Nat,
    'date' : IDL.Nat,
    'author' : Author,
    'isEditorsPick' : IDL.Bool,
    'isFeatured' : IDL.Bool,
    'category' : IDL.Text,
    'image' : IDL.Text,
  });
  return IDL.Service({
    'createPost' : IDL.Func(
        [
          IDL.Text,
          IDL.Text,
          IDL.Text,
          IDL.Nat,
          Author,
          IDL.Text,
          IDL.Bool,
          IDL.Bool,
          PostStatus,
        ],
        [Post],
        [],
      ),
    'deletePost' : IDL.Func([IDL.Nat], [IDL.Bool], []),
    'getPostById' : IDL.Func([IDL.Nat], [IDL.Opt(Post)], ['query']),
    'getPosts' : IDL.Func([], [IDL.Vec(Post)], ['query']),
    'updatePost' : IDL.Func(
        [
          IDL.Nat,
          IDL.Text,
          IDL.Text,
          IDL.Text,
          IDL.Nat,
          Author,
          IDL.Text,
          IDL.Bool,
          IDL.Bool,
          IDL.Nat,
          PostStatus,
        ],
        [IDL.Opt(Post)],
        [],
      ),
  });
};
export const init = ({ IDL }) => { return []; };
