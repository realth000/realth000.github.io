import '../config'
import { defineConfig } from '../config'

export default defineConfig({
  siteName: 'Distant Vicinity',
  slogan: '渺小，遥远，却无可代替',
  friends: [
    {
      site_name: '澄沨的漫游茶记',
      url: 'https://champhoon.xyz/',
      description: 'Stay hungry, Stay foolish.',
    }
  ],
  friendsInviteUrl: 'https://github.com',
  projects: [
    {
      name: 'miko-blog',
      description: 'Blog generator',
      homepage: 'https://github.com/realth000/miko-blog',
      tags: ['blog', 'SSG', 'mdx'],
    },
  ],
  aboutMeDocumentPath: 'TODO',
  documentsDir: 'TODO',
})
