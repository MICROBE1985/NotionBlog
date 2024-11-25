import ReactMarkdown from "react-markdown";
import remarkGfm from 'remark-gfm'
// import remarkBreaks from "remark-breaks" // 改行
import gfm from 'remark-gfm'

import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { getAllPublished, getSingleBlogPostBySlug } from "/lib/notion";
import Date from "compornents/convertdate";
import { Button, Image } from "antd";
import { RedoOutlined, FieldTimeOutlined, LoadingOutlined } from '@ant-design/icons';
import React from "react";

const CodeBlock = ({ language, codestring }) => {
  return (
    <SyntaxHighlighter language={language} style={vscDarkPlus} PreTag="div">
      {codestring}
    </SyntaxHighlighter>
  );
};
const Post = ({ post }) => {
  return (
    <div className="news-detail px-3">
      <article className="space-y-10">
        <section className="px-10 pb-10">
          <h2 className="mb-2">{post.metadata.title}</h2>

          {post.metadata.thumbnail && (
            <div className="w-[200px]">
              <Image
                preview={true}
                width="100%"
                height="100%"
                alt={post.metadata.title}
                src={post.metadata.thumbnail}
                fallback="/noimg.jpg"
                style={{ objectFit: "cover" }}
                placeholder={
                  <LoadingOutlined spin />
                }
              />
            </div>
          )}

          <div className="space-y-3 mb-10">
            {post.metadata.tags?.length > 0 && (
              <p className="flex space-x-1">
                {post.metadata.tags.map((tag) => (
                  <span className="tag" key={tag}>
                    {tag}
                  </span>
                ))}
              </p>
            )}
            <div className="flex space-x-3 justify-end">
              <p className="flex items-center space-x-1"><FieldTimeOutlined /><Date convertDate={post.metadata.date}></Date></p>
              <p className="flex items-center space-x-1"><RedoOutlined /><Date convertDate={post.last_edited_time}></Date></p>
            </div>
          </div>

          <div className="owl">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]} // reakt-markdownプラグイン
              components={{
                code({ node, inline, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || "");
                  return !inline && match ? (
                    <CodeBlock
                      codestring={String(children).replace(/\n$/, "")}
                      language={match[1]}
                    />
                  ) : (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                },
              }}
            >
              {post.mdString}
            </ReactMarkdown>
          </div>
        </section>
        <div className="text-center">
          <Button href="/" size="large" className="inline-block">Back</Button>
        </div>
      </article>
    </div>
  );
};

export const getStaticProps = async ({ params }) => {
  const post = await getSingleBlogPostBySlug(params.slug);

  // ページのメタデータと、ページのコンテンツ（notion.jsで設定したもの）
  // console.log(post)
  return {
    props: {
      post,
    },
    revalidate: 60,
  };
};

export const getStaticPaths = async () => {
  const posts = await getAllPublished();
  const paths = posts.map(({ slug }) => ({ params: { slug } }));
  return {
    paths,
    fallback: "blocking",
  };
};

export default Post;