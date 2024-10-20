interface Project {
  title: string
  description: string
  href?: string
  imgSrc?: string
  status: ProjectStatus
}

export enum ProjectStatus {
  Developing,
  Paused,
  Abandoned,
  Finished,
}

const projectsData: Project[] = [
  {
    title: 'tsdm_client',
    description: `天使动漫论坛的第三方客户端，基于flutter，支持六大主流平台，已实现大部分基础功能，功能逐渐稳定，即将发布1.0版本`,
    imgSrc:
      'https://raw.githubusercontent.com/realth000/tsdm_client/refs/heads/master/assets/images/tsdm_client-large-300x300.png',
    href: 'https://github.com/realth000/tsdm_client',
    status: ProjectStatus.Developing,
  },
  {
    title: 'flutter_bbcode_editor',
    description: `flutter原生的bbcode编辑器，基于flutter-quill，支持所见即所得，目前处在早期开发阶段`,
    href: 'https://github.com/realth000/flutter_bbcode_editor',
    status: ProjectStatus.Developing,
  },
  {
    title: 'mpax_flutter',
    description: `基于flutter的目标是跨平台版foobar2000的本地音乐播放器。由于重构了太长时间，目前处于暂停状态`,
    href: 'https://github.com/realth000/mpax_flutter',
    status: ProjectStatus.Paused,
  },
  {
    title: 'taglib_ffi',
    description: '为dart准备的taglib绑定，提供读取和写入音频源文件信息的接口，支持多种格式',
    href: 'https://github.com/realth000/taglib_ffi',
    status: ProjectStatus.Paused,
  },
]

export default projectsData
