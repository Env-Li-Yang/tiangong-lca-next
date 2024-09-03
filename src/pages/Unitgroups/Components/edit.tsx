import { getUnitGroupDetail, updateUnitGroup } from '@/services/unitgroups/api';
import { UnitTable } from '@/services/unitgroups/data';
import { genUnitGroupFromData } from '@/services/unitgroups/util';
import styles from '@/style/custom.less';
import { CloseOutlined, FormOutlined } from '@ant-design/icons';
import { ProForm } from '@ant-design/pro-components';
import type { ProFormInstance } from '@ant-design/pro-form';
import type { ActionType } from '@ant-design/pro-table';
import { Button, Collapse, Drawer, Space, Spin, Tooltip, Typography, message } from 'antd';
import type { FC } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FormattedMessage } from 'umi';
import { UnitGroupForm } from './form';

type Props = {
  id: string;
  buttonType: string;
  lang: string;
  actionRef: React.MutableRefObject<ActionType | undefined>;
  setViewDrawerVisible: React.Dispatch<React.SetStateAction<boolean>>;
};
const UnitGroupEdit: FC<Props> = ({ id, buttonType, lang, actionRef, setViewDrawerVisible }) => {
  const [drawerVisible, setDrawerVisible] = useState(false);
  const formRefEdit = useRef<ProFormInstance>();
  const [activeTabKey, setActiveTabKey] = useState<string>('unitGroupInformation');
  const [initData, setInitData] = useState<any>({});
  const [fromData, setFromData] = useState<any>({});
  const [unitDataSource, setUnitDataSource] = useState<UnitTable[]>([]);
  const [spinning, setSpinning] = useState(false);

  const handletFromData = () => {
    if (fromData?.id)
      setFromData({
        ...fromData,
        [activeTabKey]: formRefEdit.current?.getFieldsValue()?.[activeTabKey] ?? {},
      });
  };

  const handletUnitDataCreate = (data: any) => {
    if (fromData?.id)
      setUnitDataSource([
        ...unitDataSource,
        { ...data, '@dataSetInternalID': unitDataSource.length.toString() },
      ]);
  };

  const handletUnitData = (data: any) => {
    if (fromData?.id) setUnitDataSource([...data]);
  };

  const onTabChange = (key: string) => {
    setActiveTabKey(key);
  };

  const onEdit = useCallback(() => {
    setDrawerVisible(true);
  }, [setViewDrawerVisible]);

  const onReset = () => {
    setSpinning(true);
    getUnitGroupDetail(id).then(async (result: any) => {
      setInitData({ ...genUnitGroupFromData(result.data?.json?.unitGroupDataSet ?? {}), id: id });
      setFromData({
        ...genUnitGroupFromData(result.data?.json?.unitGroupDataSet ?? {}),
        id: id,
      });
      setUnitDataSource(
        genUnitGroupFromData(result.data?.json?.unitGroupDataSet ?? {})?.units?.unit ?? [],
      );
      formRefEdit.current?.resetFields();
      formRefEdit.current?.setFieldsValue({
        ...genUnitGroupFromData(result.data?.json?.unitGroupDataSet ?? {}),
        id: id,
      });
      setSpinning(false);
    });
  };

  useEffect(() => {
    if (!drawerVisible) return;
    onReset();
  }, [drawerVisible]);

  useEffect(() => {
    setFromData({
      ...fromData,
      units: {
        unit: [...unitDataSource],
      },
    });
  }, [unitDataSource]);

  return (
    <>
      {buttonType === 'icon' ? (
        <Tooltip
          title={<FormattedMessage id="pages.button.edit" defaultMessage="Edit"></FormattedMessage>}
        >
          <Button shape="circle" icon={<FormOutlined />} size="small" onClick={onEdit}></Button>
        </Tooltip>
      ) : (
        <Button size="small" onClick={onEdit}>
          <FormattedMessage id="pages.button.edit" defaultMessage="Edit"></FormattedMessage>
        </Button>
      )}

      <Drawer
        title={
          <FormattedMessage
            id="pages.unitgroup.drawer.title.edit"
            defaultMessage="Edit"
          ></FormattedMessage>
        }
        width="90%"
        closable={false}
        extra={
          <Button
            icon={<CloseOutlined />}
            style={{ border: 0 }}
            onClick={() => {
              setDrawerVisible(false);
            }}
          ></Button>
        }
        maskClosable={true}
        open={drawerVisible}
        onClose={() => {
          setDrawerVisible(false);
        }}
        footer={
          <Space size={'middle'} className={styles.footer_right}>
            <Button
              onClick={() => {
                setDrawerVisible(false);
              }}
            >
              <FormattedMessage id="pages.button.cancel" defaultMessage="Cancel"></FormattedMessage>
            </Button>
            <Button onClick={onReset}>
              <FormattedMessage id="pages.button.reset" defaultMessage="Reset"></FormattedMessage>
            </Button>
            <Button
              onClick={() => {
                formRefEdit.current?.submit();
              }}
              type="primary"
            >
              <FormattedMessage id="pages.button.submit" defaultMessage="Submit"></FormattedMessage>
            </Button>
          </Space>
        }
      >
        <Spin spinning={spinning}>
          <ProForm
            formRef={formRefEdit}
            initialValues={initData}
            onValuesChange={(_, allValues) => {
              setFromData({ ...fromData, [activeTabKey]: allValues[activeTabKey] ?? {} });
            }}
            submitter={{
              render: () => {
                return [];
              },
            }}
            onFinish={async () => {
              const updateResult = await updateUnitGroup({ ...fromData, id });
              if (updateResult?.data) {
                message.success(
                  <FormattedMessage
                    id="options.createsuccess"
                    defaultMessage="Created Successfully!"
                  ></FormattedMessage>,
                );
                setDrawerVisible(false);
                setViewDrawerVisible(false);
                setActiveTabKey('unitGroupInformation');
                actionRef.current?.reload();
              } else {
                message.error(updateResult?.error?.message);
              }
              return true;
            }}
          >
            <UnitGroupForm
              lang={lang}
              activeTabKey={activeTabKey}
              formRef={formRefEdit}
              onData={handletFromData}
              onUnitData={handletUnitData}
              onUnitDataCreate={handletUnitDataCreate}
              onTabChange={onTabChange}
              unitDataSource={unitDataSource}
            />
          </ProForm>
          <Collapse
            items={[
              {
                key: '1',
                label: 'JSON Data',
                children: (
                  <Typography>
                    <pre>{JSON.stringify(fromData, null, 2)}</pre>
                  </Typography>
                ),
              },
            ]}
          />
        </Spin>
      </Drawer>
    </>
  );
};

export default UnitGroupEdit;
