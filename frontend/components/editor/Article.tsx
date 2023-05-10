import React, { useState, useCallback, useEffect } from 'react';
import { useMutation } from 'react-query';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/router';
import { articleState, codeState, selectedLeafState } from '@/recoil/topic';
import { useRecoilState, useRecoilValue } from 'recoil';
import authApi from '@/hooks/api/axios.authorization.instance';
import { GrFlagFill } from "react-icons/gr";

interface Props {}

const queryTopicFn = async (body:any) => {
  try {
    const response = await authApi.post('topic/', body);
    return response.data;
  } catch (error) {
    console.error(error);
  }
};

const queryLeafFn = async (body:any) => {
  try {
    const response = await authApi.post('leaf/', body);
    return response.data;
  } catch (error) {
    console.error(error);
  }
};

export const Article = ({}: Props) => {
  const router = useRouter();
  const topicId = router.query.topicId;
  const [article, setArticle] = useRecoilState(articleState);
  const code = useRecoilValue(codeState);
  const selectedLeaf = useRecoilValue(selectedLeafState);
  const [localArticle, setLocalArticle] = useState(article)
  const [needHelp, setNeedHelp] = useState(false)
  const { register, handleSubmit } = useForm({
    defaultValues: {
      title: `${article.title}`,
      content: `${article.content}`,
    },
  });

  const mutateTopic = useMutation((body: any) => queryTopicFn(body), {
    onSuccess:(topicId)=>{
      router.push(`/topics/${topicId}`)
    }
  })

  const mutateLeaf = useMutation((body: any) => queryLeafFn(body), {
    onSuccess: () => {}
  })

  useEffect(() => {
    setLocalArticle(article)
  }, [article])

  const onSubmit = (data:any) => {
    // 토픽 생성 (선택된 리프가 없는 경우)
    if (!selectedLeaf.leaf_id) {
      const body = {
        ...data, 
        codes: code,
        needHelp: needHelp,
      }
      mutateTopic.mutate(body)
    }
    // 리프 생성 (선택된 리프가 존재하는 경우)
    else {
      const body = {
        ...data, 
        codes: code,
        parent_leaf_id: selectedLeaf.leaf_id,
        topic_id: topicId,
      }
      mutateLeaf.mutate(body)
    }
  };

  const handleInputChange = useCallback(
    (event: { target: { name: string; value: string; }; }) => {
      const {name, value} = event?.target
      setLocalArticle((prev) => ({...prev, [name]:value}))
      setArticle((prev) => ({...prev, [name]:value}))
    },
    [setArticle]
  )

  return (
    <div
      className="flex p-4 bg-inherit
                h-full
                md:h-1/2"
    >
      <form className='flex flex-col w-full' onSubmit={handleSubmit(onSubmit)}>
        <div className='font-bold'>Title :</div>
        <input
          className="h-8 max-w-md article-input"
          maxLength={100}
          {...register('title', { required: true, maxLength: 100 })}
          type="text"
          name="title"
          value={localArticle.title}
          onChange={handleInputChange}
          placeholder='제목'
        />
        <div className='font-bold'>Content :</div>
        <textarea
          className="resize-none h-full article-input"
          {...register('content')}
          name='content'
          value={localArticle.content || ""}
          onChange={handleInputChange}
          placeholder='내용'
        />
        <div className='flex flex-row place-self-end gap-3'>
          <div
            className={`bamboo-button w-20 min-h-full flex justify-center items-center hover:bg-red-600 ${!needHelp ? 'bg-rose-300' : 'bg-rose-500 shadow-inner' }`}
            onClick={()=>setNeedHelp((prev)=>!prev)}
          >
            {!needHelp ? `Help!` : <GrFlagFill/> }
          </div>
          <button
            className='bamboo-button'
          >
            {!selectedLeaf.leaf_id ? 'Submit' : 'Reply'}
          </button>
        </div>
      </form>
    </div>
  );
};
