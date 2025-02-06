import React from 'react'
import styles from "./heroImage.module.css"

export const HeroImage = () => {
  return (
    <div className={styles.heroContainer}>
      <div className={styles.container}>
        <div className={styles.messy}></div>
        <div className={styles.magicWand}></div>
        <div className={styles.json}>
          <pre>
            {JSON.stringify(
              {
                schema: {
                  title: "Annual Report",
                  user_id: 12345,
                  pages: 42,
                  sections: ["Financial Summary", "Market Analysis"],
                  customer:{
                    id: "id_cddiefew2d3d",
                    name: "Ali Amer",
                    email: "aliamer19ali@gmail.com",
                  }
                }
              },
              null,
              2
            )}
          </pre>
        </div>
      </div>
    </div>);
}
