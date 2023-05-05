import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Topic } from './entities/topic.entity';
import { Repository, Like } from 'typeorm';
import { SimpleTopicDto } from './dto/simple.topic.dto';
import { User } from 'src/users/entities/user.entity';
import { Leaf } from 'src/leafs/entities/leaf.entity';
import { CreateLeafDto } from 'src/leafs/dto/create.leaf.dto';
import { Code } from 'src/leafs/entities/code.entity';
import { makeTopicLeafs } from './utils/utils';
import { searchTopic } from './utils/utils';

@Injectable()
export class TopicsService {
  constructor(
    @Inject('TOPIC_REPOSITORY')
    private topicRepository: Repository<Topic>,

    @Inject('LEAF_REPOSITORY')
    private leafRepository: Repository<Leaf>,

    @Inject('CODE_REPOSITORY')
    private codeRepository: Repository<Code>,

    @Inject('USER_REPOSITORY')
    private userRepository: Repository<User>,
  ) {}

  async getAll(): Promise<SimpleTopicDto[]> {
    const getall = this.topicRepository.find({
      relations: { user: true, rootLeaf: true, bestLeaf: true },
      loadRelationIds: { relations: ['user'] },
    });
    return await getall;
  }

  //검색에서는 makeLeaf함수 가능
  async search(userInput: string) {
    //title로 조회. where문으로 검색할 수 있음. 괄호 주의
    const titleTopics = await this.topicRepository.find({
      relations: {
        user: true,
        rootLeaf: { codes: true, user: true, likes: true },
        bestLeaf: { codes: true, user: true, likes: true },
      },
      where: {
        rootLeaf: { title: Like(`%${userInput}%`) },
      },
    });
    const userTopics = await this.topicRepository.find({
      relations: {
        rootLeaf: { codes: true, user: true, likes: true },
        bestLeaf: { codes: true, user: true, likes: true },
      },
      where: { user: { nickname: Like(`%${userInput}%`) } },
    });
    //닉네임이나 타이틀로 검색 안되면 []로 들어와서 길이를 재서 유무 판별
    if (userTopics.length == 0 && titleTopics.length == 0) {
      throw new NotFoundException(
        `'${userInput}'라는 검색결과를 찾을 수 없습니다.`,
      );
    } else if (userTopics.length > 0) {
      const topics = userTopics.map((data) => searchTopic(data));
      return topics;
    } else if (titleTopics.length > 0) {
      const topics = titleTopics.map((data) => searchTopic(data));
      return topics;
    }
  }

  //getOne에서는 모든 리프를 makeTopicLeafs
  async getOne(id: number) {
    const topic = await this.topicRepository.findOne({
      where: { topic_id: id },
      relations: {
        user: true,
        rootLeaf: { codes: true, user: true, likes: true },
        bestLeaf: { codes: true, user: true, likes: true },
        leafs: { codes: true, user: true, likes: true },
      },
    });
    // console.log(topic);
    const topic_id = { topic_id: topic.topic_id };
    const needHelp = { needHelp: topic.needHelp };
    const creation_time = { creation_time: topic.creation_time };
    const rootLeaf = { rootLeaf: makeTopicLeafs(topic.rootLeaf) };
    const bestLeaf = { bestLeaf: makeTopicLeafs(topic.bestLeaf) };
    const leafs = { leafs: topic.leafs.map((data) => makeTopicLeafs(data)) };
    const response = {
      ...topic_id,
      ...needHelp,
      ...creation_time,
      ...rootLeaf,
      ...bestLeaf,
      ...leafs,
    };
    // console.log(response);
    if (!topic) {
      throw new NotFoundException(`topic id ${id} not found`);
    }
    return response;
  }

  async create(data): Promise<void> {
    //1.dto가 아닌 그냥 json파일 받아오기
    // console.log(data);

    //2. user와 needHelp를 분리
    const user = { user: { user_id: data.user_id } };
    const need_help = { needHelp: data.needHelp };
    //3.분리한 것으로 topic생성
    const topic = { ...user, ...need_help };
    const newTopic = this.topicRepository.create(topic);
    // console.log(newTopic);
    await this.topicRepository.save(newTopic);
    //4.생성된 topic_id받아오기
    const topic_id = { topic: { topic_id: newTopic.topic_id } };
    // console.log(topic_id);
    //5.topic은 무조건 is_root가 true
    const is_root = { is_root: true };
    //5-1. type 결정하는 로직
    let type = { type: 1 };
    if (data.codes.length == 0) {
      type = { type: 0 };
    }
    //6.data에서 user_id와 needHelp를 분리
    const { user_id, needHelp, ...obj } = data;
    data = obj;
    //7. leafDto를 생성
    const leaf: CreateLeafDto = {
      ...user,
      ...type,
      ...data,
      ...is_root,
      ...topic_id,
    };
    const newLeaf = this.leafRepository.create(leaf);
    // console.log(newLeaf);
    await this.leafRepository.save(newLeaf);
    //8.leaf_id 받아오기
    // console.log(data.codes.length);
    const leaf_id = { leaf: { leaf_id: newLeaf.leaf_id } };
    //8-1. topic이 생성될 때 best_leaf는 root_leaf이므로 topic entity의 best_leaf_id에 leaf_id 수정.
    await this.topicRepository.update(newTopic.topic_id, {
      rootLeaf: { leaf_id: newLeaf.leaf_id },
      bestLeaf: { leaf_id: newLeaf.leaf_id },
    });
    //9.codes의 갯수만큼 for문 돌면서 code생성
    for (let index = 0; index < data.codes.length; index++) {
      const code = { ...leaf_id, ...data.codes[index] };
      // console.log(code);
      const newCodes = this.codeRepository.create(code);
      // console.log(newCodes);
      await this.codeRepository.save(newCodes);
    }
  }

  //   async deleteOne(id: number): Promise<void> {
  //     const simpleUserDto = await this.getOne(id);
  //     if (simpleUserDto) {
  //       await this.userRepository.delete(id);
  //     }
  //   }
  async closeHelp(id: number): Promise<void> {
    await this.topicRepository.update(id, { needHelp: false });
  }

  //   async update(id: number, updateUserDto: UpdateUserDto): Promise<void> {
  //     const simpleUserDto = await this.getOne(id);
  //     if (simpleUserDto) {
  //       await this.userRepository
  //         .createQueryBuilder()
  //         .update(User)
  //         .set({
  //           nickname: updateUserDto.nickname,
  //           image: updateUserDto.image,
  //           introduce: updateUserDto.introduce,
  //         })
  //         .where('user_id = :id', { id })
  //         .execute();
  //     }
  //   }
}
