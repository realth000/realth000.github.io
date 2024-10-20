import projectsData, { ProjectStatus } from '@/data/projectsData'
import Card from '@/components/Card'
import { genPageMetadata } from 'app/seo'

export const metadata = genPageMetadata({ title: 'Projects' })

const h2Style =
  'text-3xl font-bold leading-7 tracking-tight text-gray-900 dark:text-gray-100 pt-8 pb-4 ' +
  'sm:text-3xl sm:leading-8 ' +
  'md:text-4xl md:leading-11'

const hintStyle = 'text-base leading-4 text-gray-500 dark:text-gray-400 space-x-8 py-4 '

export default function Projects() {
  return (
    <>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        <div className="space-y-2 pb-8 pt-6 md:space-y-5">
          <h1 className="text-3xl font-extrabold leading-9 tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl sm:leading-10 md:text-6xl md:leading-14">
            项目
          </h1>
          <p className="text-lg leading-7 text-gray-500 dark:text-gray-400">
            正在做和已经做
            <span className="line-through">弃坑</span>
            的项目
          </p>
        </div>
        <div className="container">
          <h2 className={h2Style}>进行中</h2>
          <p className={hintStyle}>火热进行中</p>
          <div className="-m-4 flex flex-wrap">
            {projectsData
              .filter((d) => d.status === ProjectStatus.Developing)
              .map((d) => (
                <Card
                  key={d.title}
                  title={d.title}
                  description={d.description}
                  imgSrc={d.imgSrc}
                  href={d.href}
                  width={300}
                  height={300}
                />
              ))}
          </div>
          <h2 className={h2Style}>已暂停</h2>
          <p className={hintStyle}>面临咕咕危机</p>
          <div className="-m-4 flex flex-wrap">
            {projectsData
              .filter((d) => d.status === ProjectStatus.Paused)
              .map((d) => (
                <Card
                  key={d.title}
                  title={d.title}
                  description={d.description}
                  imgSrc={d.imgSrc}
                  href={d.href}
                  width={300}
                  height={300}
                />
              ))}
          </div>
        </div>
      </div>
    </>
  )
}
