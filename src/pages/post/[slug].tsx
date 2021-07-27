import Head from 'next/head';
import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';

import { RichText } from 'prismic-dom';
import Prismic from '@prismicio/client';
import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): JSX.Element {
  const router = useRouter();

  if (router.isFallback) {
    return <div>Carregando...</div>;
  }

  const formatPost = {
    ...post,
    first_publication_date: format(
      new Date(post.first_publication_date),
      'dd MMM yyy'
    ).toLowerCase(),
  };

  const fullText = post.data.content.reduce((acc, item) => {
    return acc + item.heading + RichText.asText(item.body);
  }, '');

  const readTimeDocument = Math.round(
    fullText.split(/[!,?,.,' ']/).length / 200
  );

  return (
    <>
      <Head>
        <title>{formatPost.data?.title} | ignews</title>
      </Head>

      <main className={styles.container}>
        <img src={formatPost.data?.banner.url} alt={formatPost.data?.title} />
        <article className={`${styles.post} ${commonStyles.content}`}>
          <h1>{formatPost.data?.title}</h1>
          <div className={styles.info}>
            <span>
              <FiUser />
              {formatPost.data?.author}
            </span>
            <time>
              <FiCalendar />

              {formatPost?.first_publication_date}
            </time>
            <span>
              <FiClock />
              {readTimeDocument} min
            </span>
          </div>

          {formatPost.data?.content.map(content => (
            <section key={content.heading}>
              <h4>{content?.heading}</h4>
              <div
                dangerouslySetInnerHTML={{
                  __html: RichText.asHtml(content.body),
                }}
              />
            </section>
          ))}
        </article>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    [Prismic.predicates.at('document.type', 'post')],
    {
      fetch: ['post.title', 'post.subtitle', 'post.author', 'post.content'],
      pageSize: 2,
      page: 1,
    }
  );

  const paths = posts.results.map(post => ({
    params: {
      slug: post.uid,
    },
  }));

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;
  const prismic = getPrismicClient();

  const response = await prismic.getByUID('post', String(slug), {});

  if (!response) {
    return {
      props: {
        post: 'error',
      },
    };
  }

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: response.data.content.map(content => {
        return {
          heading: content.heading,
          body: content.body,
        };
      }),
    },
  };

  return {
    props: {
      post,
    },
  };
};
