(function () {
  var implementors = Object.fromEntries([
    [
      'automerge',
      [
        [
          'impl <a class="trait" href="https://doc.rust-lang.org/1.91.0/core/fmt/trait.Display.html" title="trait core::fmt::Display">Display</a> for <a class="enum" href="automerge/enum.LoadChangeError.html" title="enum automerge::LoadChangeError">LoadError</a>',
        ],
        [
          'impl <a class="trait" href="https://doc.rust-lang.org/1.91.0/core/fmt/trait.Display.html" title="trait core::fmt::Display">Display</a> for <a class="enum" href="automerge/enum.ObjId.html" title="enum automerge::ObjId">ExId</a>',
        ],
        [
          'impl <a class="trait" href="https://doc.rust-lang.org/1.91.0/core/fmt/trait.Display.html" title="trait core::fmt::Display">Display</a> for <a class="enum" href="automerge/enum.ObjIdFromBytesError.html" title="enum automerge::ObjIdFromBytesError">ObjIdFromBytesError</a>',
        ],
        [
          'impl <a class="trait" href="https://doc.rust-lang.org/1.91.0/core/fmt/trait.Display.html" title="trait core::fmt::Display">Display</a> for <a class="enum" href="automerge/enum.ObjType.html" title="enum automerge::ObjType">ObjType</a>',
        ],
        [
          'impl <a class="trait" href="https://doc.rust-lang.org/1.91.0/core/fmt/trait.Display.html" title="trait core::fmt::Display">Display</a> for <a class="enum" href="automerge/enum.ParseChangeHashError.html" title="enum automerge::ParseChangeHashError">ParseChangeHashError</a>',
        ],
        [
          'impl <a class="trait" href="https://doc.rust-lang.org/1.91.0/core/fmt/trait.Display.html" title="trait core::fmt::Display">Display</a> for <a class="enum" href="automerge/enum.Prop.html" title="enum automerge::Prop">Prop</a>',
        ],
        [
          'impl <a class="trait" href="https://doc.rust-lang.org/1.91.0/core/fmt/trait.Display.html" title="trait core::fmt::Display">Display</a> for <a class="enum" href="automerge/enum.ScalarValue.html" title="enum automerge::ScalarValue">ScalarValue</a>',
        ],
        [
          'impl <a class="trait" href="https://doc.rust-lang.org/1.91.0/core/fmt/trait.Display.html" title="trait core::fmt::Display">Display</a> for <a class="enum" href="automerge/error/enum.AutomergeError.html" title="enum automerge::error::AutomergeError">AutomergeError</a>',
        ],
        [
          'impl <a class="trait" href="https://doc.rust-lang.org/1.91.0/core/fmt/trait.Display.html" title="trait core::fmt::Display">Display</a> for <a class="enum" href="automerge/error/enum.HydrateError.html" title="enum automerge::error::HydrateError">HydrateError</a>',
        ],
        [
          'impl <a class="trait" href="https://doc.rust-lang.org/1.91.0/core/fmt/trait.Display.html" title="trait core::fmt::Display">Display</a> for <a class="enum" href="automerge/error/enum.InvalidOpType.html" title="enum automerge::error::InvalidOpType">InvalidOpType</a>',
        ],
        [
          'impl <a class="trait" href="https://doc.rust-lang.org/1.91.0/core/fmt/trait.Display.html" title="trait core::fmt::Display">Display</a> for <a class="enum" href="automerge/error/enum.UpdateObjectError.html" title="enum automerge::error::UpdateObjectError">UpdateObjectError</a>',
        ],
        [
          'impl <a class="trait" href="https://doc.rust-lang.org/1.91.0/core/fmt/trait.Display.html" title="trait core::fmt::Display">Display</a> for <a class="enum" href="automerge/patches/enum.PatchAction.html" title="enum automerge::patches::PatchAction">PatchAction</a>',
        ],
        [
          'impl <a class="trait" href="https://doc.rust-lang.org/1.91.0/core/fmt/trait.Display.html" title="trait core::fmt::Display">Display</a> for <a class="enum" href="automerge/sync/enum.DecodeStateError.html" title="enum automerge::sync::DecodeStateError">DecodeError</a>',
        ],
        [
          'impl <a class="trait" href="https://doc.rust-lang.org/1.91.0/core/fmt/trait.Display.html" title="trait core::fmt::Display">Display</a> for <a class="enum" href="automerge/sync/enum.ReadMessageError.html" title="enum automerge::sync::ReadMessageError">ReadMessageError</a>',
        ],
        [
          'impl <a class="trait" href="https://doc.rust-lang.org/1.91.0/core/fmt/trait.Display.html" title="trait core::fmt::Display">Display</a> for <a class="struct" href="automerge/error/struct.InvalidActorId.html" title="struct automerge::error::InvalidActorId">InvalidActorId</a>',
        ],
        [
          'impl <a class="trait" href="https://doc.rust-lang.org/1.91.0/core/fmt/trait.Display.html" title="trait core::fmt::Display">Display</a> for <a class="struct" href="automerge/error/struct.InvalidChangeHashSlice.html" title="struct automerge::error::InvalidChangeHashSlice">InvalidChangeHashSlice</a>',
        ],
        [
          'impl <a class="trait" href="https://doc.rust-lang.org/1.91.0/core/fmt/trait.Display.html" title="trait core::fmt::Display">Display</a> for <a class="struct" href="automerge/error/struct.InvalidElementId.html" title="struct automerge::error::InvalidElementId">InvalidElementId</a>',
        ],
        [
          'impl <a class="trait" href="https://doc.rust-lang.org/1.91.0/core/fmt/trait.Display.html" title="trait core::fmt::Display">Display</a> for <a class="struct" href="automerge/error/struct.InvalidObjectId.html" title="struct automerge::error::InvalidObjectId">InvalidObjectId</a>',
        ],
        [
          'impl <a class="trait" href="https://doc.rust-lang.org/1.91.0/core/fmt/trait.Display.html" title="trait core::fmt::Display">Display</a> for <a class="struct" href="automerge/error/struct.InvalidOpId.html" title="struct automerge::error::InvalidOpId">InvalidOpId</a>',
        ],
        [
          'impl <a class="trait" href="https://doc.rust-lang.org/1.91.0/core/fmt/trait.Display.html" title="trait core::fmt::Display">Display</a> for <a class="struct" href="automerge/hydrate/struct.Text.html" title="struct automerge::hydrate::Text">Text</a>',
        ],
        [
          'impl <a class="trait" href="https://doc.rust-lang.org/1.91.0/core/fmt/trait.Display.html" title="trait core::fmt::Display">Display</a> for <a class="struct" href="automerge/marks/struct.MarkData.html" title="struct automerge::marks::MarkData">MarkData</a>',
        ],
        [
          'impl <a class="trait" href="https://doc.rust-lang.org/1.91.0/core/fmt/trait.Display.html" title="trait core::fmt::Display">Display</a> for <a class="struct" href="automerge/struct.ActorId.html" title="struct automerge::ActorId">ActorId</a>',
        ],
        [
          'impl <a class="trait" href="https://doc.rust-lang.org/1.91.0/core/fmt/trait.Display.html" title="trait core::fmt::Display">Display</a> for <a class="struct" href="automerge/struct.ChangeHash.html" title="struct automerge::ChangeHash">ChangeHash</a>',
        ],
        [
          'impl <a class="trait" href="https://doc.rust-lang.org/1.91.0/core/fmt/trait.Display.html" title="trait core::fmt::Display">Display</a> for <a class="struct" href="automerge/struct.Cursor.html" title="struct automerge::Cursor">Cursor</a>',
        ],
        [
          'impl <a class="trait" href="https://doc.rust-lang.org/1.91.0/core/fmt/trait.Display.html" title="trait core::fmt::Display">Display</a> for <a class="struct" href="automerge/sync/struct.DecodeBloomError.html" title="struct automerge::sync::DecodeBloomError">DecodeError</a>',
        ],
        [
          'impl&lt;\'a&gt; <a class="trait" href="https://doc.rust-lang.org/1.91.0/core/fmt/trait.Display.html" title="trait core::fmt::Display">Display</a> for <a class="enum" href="automerge/enum.Value.html" title="enum automerge::Value">Value</a>&lt;\'a&gt;',
        ],
      ],
    ],
  ]);
  if (window.register_implementors) {
    window.register_implementors(implementors);
  } else {
    window.pending_implementors = implementors;
  }
})();
//{"start":57,"fragment_lengths":[7177]}
