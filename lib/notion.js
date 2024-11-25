export const getAllPublished = async () => {
  const posts = await notion.databases.query({
    database_id: process.env.DATABASE_ID,
    filter: {
      property: "Published",
      checkbox: {
        equals: true,
      },
    },
    sorts: [
      {
        property: "Date",
        direction: "descending",
      },
    ],
  });

  // await関数 記事が取得できてから実行
  const allPosts = posts.results;
  // 各記事をmapに
  return allPosts.map((post) => {
    return getPageMetaData(post);
  });
};

// 各記事
const getPageMetaData = (post) => {
  // タグは複数あるのでmapに
  const getTags = (tags) => {
    const allTags = tags.map((tag) => {
      return tag.name;
    });
    return allTags;
  };

  // Notionから取得したプロパティを適切な形式に整形
  // └ リッチテキストをプレーンテキストに    
  return {
    id: post.id,
    last_edited_time: post.last_edited_time,
    title: post.properties.Name.title[0].plain_text,
    tags: getTags(post.properties.Tags.multi_select),
    description: post.properties.Description.rich_text[0]?.plain_text || false,
    date: post.properties.Date.created_time,
    slug: post.properties.Slug.rich_text[0].plain_text,
    // オプショナルチェイニング（サムネがあって、fileの配列の１つ目があれば、fileurlを返す、なければnull）。undefinedだとエラーなる
    // サムネがあれば、file.urlを、なければ null にできればOK
    thumbnail: post.properties.Thumb?.files[0]?.file.url || null,
  };
}

// Notion APIクライアントのセットアップ
const { Client } = require("@notionhq/client")
const notion = new Client({
  auth: process.env.NOTION_TOKEN,
})

const { NotionToMarkdown } = require("notion-to-md");
// const n2m = new NotionToMarkdown({ notionClient: notion });

const n2m = new NotionToMarkdown({
  notionClient: notion,
  config: {
    parseChildPages: false, // 子ページをパースしない
  }
});

export const getSingleBlogPostBySlug = async (slug) => {
  // Notionからブログ記事を取得する
  const response = await notion.databases.query({
    database_id: process.env.DATABASE_ID,
    filter: {
      // フィルタリング条件を指定（Slugが対象）
      property: "Slug",
      // フィルタリング条件を設定
      formula: {
        // 文字列のデータを比較する条件
        string: {
          // 指定された値と等しいかどうか
          equals: slug, // 指定されたスラッグに一致する記事を取得する
        },
      },
    },
  });

  // 取得したレスポンスから、記事を取得
  const page = response.results[0];
  // console.log(page)

  // 取得したページのメタデータを整形（ID、最終編集日時、タイトル、タグ、説明、投稿日時、スラッグ、サムネイルなど）
  const metadata = getPageMetaData(page);
  // console.log(metadata))

  // Notionページをマークダウン形式に変換
  // ページの内容 JSON → type,blockId,parent,childrenなど
  const mdblocks = await n2m.pageToMarkdown(page.id);
  // console.log(mdblocks);

  // mdblocks の中のすべてのブロックをチェックして、子要素を取得して返す
  function getChildren(blocks) {
    const children = [];
    blocks.forEach(block => {
      if (block.children && block.children.length > 0) {
        children.push({
          parent: block.parent,
          children: block.children
        });
      }
    });
    return children;
  }

  // mdblocks の中の子要素を取得する
  const children = getChildren(mdblocks);

  // 子要素の情報をログに出力する
  // console.log(children);

  // ページ内容のJSONをマークダウンに変換
  const mdString = mdblocks.map(block => block.parent).join("\n");
  // console.log(mdString);

  // メタデータとマークダウン形式のコンテンツを含むオブジェクトを返す
  return {
    metadata,
    mdString,
    children
  };
}

