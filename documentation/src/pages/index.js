import React, { useState } from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import ProjectReadme from "../components/ReademeMD";
import styles from './index.module.css';
import MDXContent from '@theme/MDXContent';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <h1 className="hero__title">{siteConfig.title}</h1>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <p className={styles.heroDescription}>
          Visit our <a href="https://sketchtoscreen-dev.onrender.com" target="_blank" rel="noopener noreferrer" className={styles.heroLink}>live website</a> to give it a try!
        </p>
      </div>
    </header>
  );
}

function Contributors() {
    const [imageError, setImageError] = useState(false);

    const handleImageError = () => {
        setImageError(true);
    };

    const contributorsImageSrc = imageError
        ? 'https://via.placeholder.com/400x100/f0f0f0/666666?text=Contributors+Not+Available'
        : `https://contrib.rocks/image?repo=${process.env.ORG_NAME}/${process.env.PROJECT_NAME}`;

    const linkHref = imageError
        ? 'tutorial/tutorial-basics/set-environment-variables'
        : `https://github.com/${process.env.ORG_NAME}/${process.env.PROJECT_NAME}/graphs/contributors`;

    return <div className={styles.contributors}>
        <a href={linkHref}>
            <img
                src={contributorsImageSrc}
                alt={imageError ? 'Contributors image not available - click to learn how to set environment variables.' : 'Contributors'}
                onError={handleImageError}
            />
        </a>
        <p>Made with<a href={"https://contrib.rocks"}> contrib.rocks</a>.
        </p>
    </div>;
}

export default function Home() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
        title={`Hello from ${siteConfig.title}`}
        description="Description will go into a meta tag in <head />">
        <HomepageHeader/>
        <main>
            <MDXContent>
                <ProjectReadme/>
                <Contributors/>
            </MDXContent>
        </main>
    </Layout>
  );
}

<div style={{textAlign: 'center'}}>
    <p className={styles.heroDescription}>
      Visit our <a href="YOUR_URL_HERE" target="_blank" rel="noopener noreferrer" className={styles.heroLink}>live website</a> to give it a try!
    </p>
  </div>